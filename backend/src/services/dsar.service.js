import {
  DSAR_TYPES_REQUIRING_IDENTITY,
  PUBLIC_PRIVACY_REQUEST_ACK_MESSAGE,
} from "../constants/dsar.js";
import {
  dsarAccessDeniedError,
  dsarAccountRequiredError,
  dsarEmailRequiredError,
  dsarExportNotAvailableError,
  dsarPdfUnavailableError,
  dsarRequestNotFoundError,
} from "../domain/errors.js";
import {
  assertAdmin,
  assertAttorneyAccess,
  assertAuthenticated,
} from "../domain/user.policy.js";
import { findLatestLeadByUserId, updateLeadContactById } from "../repositories/lead.repository.js";
import {
  appendAdminNotes,
  createDsarEvent,
  createDsarRequest,
  findDsarRequestById,
  listAllDsarRequests,
  listDsarEventsByRequestId,
  listDsarRequestsForAccount,
  updateDsarRequest,
} from "../repositories/dsar.repository.js";
import {
  findUserByEmail,
  findUserById,
  setUserCcpaSaleOptOut,
  setUserProcessingRestriction,
  updateUserFullNameById,
} from "../repositories/user.repository.js";
import {
  assertAllowedCorrectionFields,
  assertIdentityVerified,
  assertNoLegalHold,
  assertStatusTransition,
  isDeletionRequestType,
  isExportRequestType,
  mapDsarEventRow,
  mapDsarRequestRow,
  normalizeRequestType,
} from "../utils/dsar.js";
import {
  renderDsarExportPdf,
  resolveDsarPdfAbsolutePath,
  writeDsarPdfToDisk,
} from "./dsar-pdf-export.service.js";
import { readSensitiveDocumentFile } from "./document-storage.service.js";
import { anonymizeUserRecord } from "./dsar-anonymization.service.js";
import { buildUserDataExport } from "./dsar-export.service.js";
import { textForAdminStorage } from "./payment-notes.service.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { buildActor } from "../utils/auditContext.js";

async function appendSanitizedAdminNotes(requestId, notes) {
  if (!notes) {
    return null;
  }

  return appendAdminNotes(requestId, textForAdminStorage(notes));
}

function initialStatusForType(type) {
  return DSAR_TYPES_REQUIRING_IDENTITY.includes(type)
    ? "identity_verification_required"
    : "submitted";
}

function initialIdentityStatus() {
  return "pending";
}

async function logEvent(requestId, actorUserId, eventType, metadata) {
  return createDsarEvent({
    dsarRequestId: requestId,
    actorUserId,
    eventType,
    metadata,
  });
}

async function auditDsar({
  eventType,
  action,
  actor,
  requestId,
  auditContext,
  metadata = {},
  result = AUDIT_RESULTS.SUCCESS,
}) {
  await recordAuditEvent({
    eventType,
    category: AUDIT_CATEGORIES.DSAR,
    action,
    result,
    ...buildActor(actor),
    targetType: "dsar_request",
    targetId: requestId,
    request: auditContext,
    metadata,
  });
}

function userOwnsRequest(request, { userId, email }) {
  if (request.requester_user_id) {
    return request.requester_user_id === userId;
  }

  return (
    email &&
    request.requester_email &&
    request.requester_email.toLowerCase() === email.toLowerCase()
  );
}

async function getRequestForUser(requestId, user) {
  const request = await findDsarRequestById(requestId);

  if (!request) {
    throw dsarRequestNotFoundError();
  }

  if (!userOwnsRequest(request, { userId: user.id, email: user.email })) {
    throw dsarAccessDeniedError();
  }

  return request;
}

async function submitDsarRequest({
  requesterUserId,
  requesterEmail,
  type,
  message,
  requestedChanges,
  actorUserId,
  auditContext,
}) {
  const normalizedType = normalizeRequestType(type);

  if (normalizedType === "correction" && requestedChanges) {
    assertAllowedCorrectionFields(requestedChanges);
  }

  const status = initialStatusForType(normalizedType);
  const row = await createDsarRequest({
    requesterUserId,
    requesterEmail,
    requestType: normalizedType,
    status,
    identityVerificationStatus: initialIdentityStatus(),
    userMessage: message,
    requestedChanges,
  });

  await logEvent(row.id, actorUserId ?? null, "submitted", { type: normalizedType });

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_REQUEST_SUBMIT,
    action: "submit",
    actor: actorUserId ? { id: actorUserId } : null,
    requestId: row.id,
    auditContext,
    metadata: {
      requestType: normalizedType,
      newStatus: status,
      changedFields: requestedChanges ? Object.keys(requestedChanges) : [],
      targetUserId: requesterUserId,
    },
  });

  if (status === "identity_verification_required") {
    await logEvent(row.id, actorUserId ?? null, "identity_verification_requested", {
      type: normalizedType,
    });
  }

  if (normalizedType === "objection") {
    await logEvent(row.id, actorUserId ?? null, "objection_submitted", {});
  }

  return mapDsarRequestRow(row);
}

async function getRequestForAdmin(requestId) {
  const request = await findDsarRequestById(requestId);

  if (!request) {
    throw dsarRequestNotFoundError();
  }

  return request;
}

async function loadAdminRequestDetail(request) {
  const events = await listDsarEventsByRequestId(request.id);
  return mapDsarRequestRow(
    { ...request, events },
    { includeAdmin: true, includeEvents: true }
  );
}

export async function createUserDsarRequest({
  user,
  type,
  message,
  requestedChanges,
  auditContext = null,
}) {
  assertAuthenticated(user);

  return submitDsarRequest({
    requesterUserId: user.id,
    requesterEmail: user.email,
    type,
    message,
    requestedChanges,
    actorUserId: user.id,
    auditContext,
  });
}

export async function createPublicPrivacyRequest({
  user,
  type,
  email,
  message,
  requestedChanges,
  auditContext = null,
}) {
  const requesterEmail = user?.email ?? email;

  if (!requesterEmail) {
    throw dsarEmailRequiredError();
  }

  let requesterUserId = user?.id ?? null;

  if (!requesterUserId && email) {
    const matched = await findUserByEmail(email);
    requesterUserId = matched?.id ?? null;
  }

  const request = await submitDsarRequest({
    requesterUserId,
    requesterEmail,
    type,
    message,
    requestedChanges,
    actorUserId: user?.id ?? null,
    auditContext,
  });

  return {
    id: request.id,
    type: request.type,
    status: request.status,
    message: PUBLIC_PRIVACY_REQUEST_ACK_MESSAGE,
  };
}

export async function listUserDsarRequests(user) {
  const rows = await listDsarRequestsForAccount({
    userId: user.id,
    email: user.email,
  });
  return rows.map((row) => mapDsarRequestRow(row));
}

export async function getUserDsarRequest({ user, requestId }) {
  const request = await getRequestForUser(requestId, user);
  return mapDsarRequestRow(request);
}

function parseExportPayload(request) {
  if (!request.export_payload_json) return null;
  return typeof request.export_payload_json === "string"
    ? JSON.parse(request.export_payload_json)
    : request.export_payload_json;
}

export async function getUserDsarExport({ user, requestId }) {
  const request = await getRequestForUser(requestId, user);

  if (!isExportRequestType(request.request_type)) {
    throw dsarExportNotAvailableError();
  }

  assertIdentityVerified(request);

  const payload = parseExportPayload(request);

  if (payload) {
    return {
      generatedAt: payload.generatedAt,
      requestId,
      export: payload,
    };
  }

  throw dsarExportNotAvailableError();
}

export async function getUserDsarPdfExport({ user, requestId }) {
  const request = await getRequestForUser(requestId, user);

  if (!isExportRequestType(request.request_type)) {
    throw dsarExportNotAvailableError();
  }

  assertIdentityVerified(request);

  if (!request.export_pdf_path) {
    throw dsarExportNotAvailableError();
  }

  const absolutePath = resolveDsarPdfAbsolutePath(request.export_pdf_path);
  const pdfBuffer = await readSensitiveDocumentFile(absolutePath);

  return {
    pdfBuffer,
    filename: `privacy-export-${requestId}.pdf`,
  };
}

export async function listAdminDsarRequests(actor) {
  assertAttorneyAccess(actor);
  const rows = await listAllDsarRequests();
  return Promise.all(rows.map((row) => loadAdminRequestDetail(row)));
}

export async function getAdminDsarRequest({ actor, requestId }) {
  assertAttorneyAccess(actor);
  const request = await getRequestForAdmin(requestId);
  return loadAdminRequestDetail(request);
}

export async function verifyDsarIdentity({
  actor,
  requestId,
  status,
  notes,
  auditContext = null,
}) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);

  const identityStatus = status;
  const updates = {
    identityVerificationStatus: identityStatus,
  };

  if (identityStatus === "verified") {
    updates.identityVerifiedAt = new Date();
    updates.identityVerifiedBy = actor.id;
    updates.status = "identity_verified";
    assertStatusTransition(request.status, "identity_verified");
    await logEvent(requestId, actor.id, "identity_verified", {
      fieldNames: ["identity_verification_status"],
    });
  } else if (identityStatus === "failed") {
    updates.status = "denied";
    await logEvent(requestId, actor.id, "identity_failed", {});
    await logEvent(requestId, actor.id, "denied", { reason: "identity_verification_failed" });
    await auditDsar({
      eventType: AUDIT_EVENT_TYPES.DSAR_IDENTITY_FAILED,
      action: "identity_failed",
      actor,
      requestId,
      auditContext,
      metadata: { requestType: request.request_type },
      result: AUDIT_RESULTS.FAILURE,
    });
  }

  if (notes) {
    await appendSanitizedAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  const updated = await updateDsarRequest(requestId, updates);

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_IDENTITY_VERIFY,
    action: "verify_identity",
    actor,
    requestId,
    auditContext,
    metadata: {
      requestType: request.request_type,
      oldStatus: request.status,
      newStatus: updated.status,
      identityStatus,
    },
  });

  return loadAdminRequestDetail(updated);
}

export async function generateDsarExport({ actor, requestId, auditContext = null }) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);

  if (!isExportRequestType(request.request_type)) {
    throw dsarExportNotAvailableError();
  }

  if (!request.requester_user_id) {
    throw dsarAccountRequiredError();
  }

  const exportPayload = await buildUserDataExport(request.requester_user_id);
  exportPayload.requestId = requestId;

  const updated = await updateDsarRequest(requestId, {
    exportPayloadJson: exportPayload,
    exportGeneratedAt: new Date(),
    status: "action_required",
  });

  await logEvent(requestId, actor.id, "export_generated", {
    fieldNames: Object.keys(exportPayload),
  });

  if (request.request_type === "portability") {
    await logEvent(requestId, actor.id, "portability_exported", {});
    await auditDsar({
      eventType: AUDIT_EVENT_TYPES.DSAR_PORTABILITY_EXPORT,
      action: "portability_export",
      actor,
      requestId,
      auditContext,
      metadata: { requestType: request.request_type },
    });
  }

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_EXPORT_GENERATE,
    action: "generate_export",
    actor,
    requestId,
    auditContext,
    metadata: {
      requestType: request.request_type,
      recordCounts: { sections: Object.keys(exportPayload).length },
    },
  });

  return loadAdminRequestDetail(updated);
}

export async function generateDsarPdfExport({ actor, requestId, auditContext = null }) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);

  if (!isExportRequestType(request.request_type)) {
    throw dsarExportNotAvailableError();
  }

  let exportPayload = parseExportPayload(request);

  if (!exportPayload) {
    if (!request.requester_user_id) {
      throw dsarAccountRequiredError();
    }
    exportPayload = await buildUserDataExport(request.requester_user_id);
    exportPayload.requestId = requestId;
    await updateDsarRequest(requestId, {
      exportPayloadJson: exportPayload,
      exportGeneratedAt: new Date(),
    });
  }

  try {
    const pdfBuffer = await renderDsarExportPdf(exportPayload, { requestId });
    const relativePath = await writeDsarPdfToDisk({ requestId, pdfBuffer });

    const updated = await updateDsarRequest(requestId, {
      exportPdfPath: relativePath,
      exportGeneratedAt: new Date(),
    });

    await logEvent(requestId, actor.id, "pdf_generated", {});

    await auditDsar({
      eventType: AUDIT_EVENT_TYPES.DSAR_EXPORT_PDF,
      action: "generate_pdf_export",
      actor,
      requestId,
      auditContext,
      metadata: { requestType: request.request_type },
    });

    return loadAdminRequestDetail(updated);
  } catch {
    throw dsarPdfUnavailableError();
  }
}

export async function applyDsarCorrection({
  actor,
  requestId,
  userFields,
  leadFields,
  notes,
  auditContext = null,
}) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);

  const changedFields = [];

  if (userFields?.fullName) {
    await updateUserFullNameById(request.requester_user_id, userFields.fullName);
    changedFields.push("full_name");
  }

  if (leadFields) {
    const lead = await findLatestLeadByUserId(request.requester_user_id);

    if (lead) {
      await updateLeadContactById({
        leadId: lead.id,
        firstName: leadFields.firstName,
        lastName: leadFields.lastName,
        phone: leadFields.phone,
        email: leadFields.email,
      });
      changedFields.push(
        ...Object.keys(leadFields).map((k) => `lead.${k}`)
      );
    }
  }

  const updated = await updateDsarRequest(requestId, {
    status: "completed",
    completedAt: new Date(),
    completedBy: actor.id,
  });

  await logEvent(requestId, actor.id, "correction_applied", { fieldNames: changedFields });
  await logEvent(requestId, actor.id, "completed", {});

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_CORRECTION_APPLY,
    action: "apply_correction",
    actor,
    requestId,
    auditContext,
    metadata: {
      requestType: request.request_type,
      changedFields,
      oldStatus: request.status,
      newStatus: updated.status,
    },
  });

  if (notes) {
    await appendSanitizedAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  return loadAdminRequestDetail(updated);
}

export async function applyDsarAnonymization({
  actor,
  requestId,
  notes,
  auditContext = null,
}) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);
  assertNoLegalHold(request);

  if (!isDeletionRequestType(request.request_type)) {
    throw dsarRequestNotFoundError();
  }

  if (!request.requester_user_id) {
    throw dsarAccountRequiredError();
  }

  await anonymizeUserRecord(request.requester_user_id);

  const updated = await updateDsarRequest(requestId, {
    status: "completed",
    completedAt: new Date(),
    completedBy: actor.id,
  });

  await logEvent(requestId, actor.id, "anonymization_applied", {
    userId: request.requester_user_id,
  });
  await logEvent(requestId, actor.id, "completed", {});

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_ANONYMIZATION_APPLY,
    action: "apply_anonymization",
    actor,
    requestId,
    auditContext,
    metadata: {
      requestType: request.request_type,
      oldStatus: request.status,
      newStatus: updated.status,
    },
  });

  if (notes) {
    await appendSanitizedAdminNotes(requestId, notes);
  }

  return loadAdminRequestDetail(updated);
}

export async function applyDsarRestriction({
  actor,
  requestId,
  notes,
  auditContext = null,
}) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);

  await setUserProcessingRestriction({
    userId: request.requester_user_id,
    reason: notes ? textForAdminStorage(notes) : "DSAR restriction request",
    restricted: true,
  });

  const updated = await updateDsarRequest(requestId, {
    status: "completed",
    completedAt: new Date(),
    completedBy: actor.id,
  });

  await logEvent(requestId, actor.id, "restriction_applied", {});
  await logEvent(requestId, actor.id, "completed", {});

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_RESTRICTION_APPLY,
    action: "apply_restriction",
    actor,
    requestId,
    auditContext,
    metadata: {
      requestType: request.request_type,
      oldStatus: request.status,
      newStatus: updated.status,
    },
  });

  if (notes) {
    await appendSanitizedAdminNotes(requestId, notes);
  }

  return loadAdminRequestDetail(updated);
}

export async function updateDsarLegalHold({
  actor,
  requestId,
  legalHold,
  reason,
  notes,
  auditContext = null,
}) {
  assertAttorneyAccess(actor);
  const request = await getRequestForAdmin(requestId);

  const updates = {
    legalHold,
    legalHoldReason: legalHold ? reason : null,
    legalHoldAppliedBy: legalHold ? actor.id : null,
    legalHoldAppliedAt: legalHold ? new Date() : null,
  };

  const updated = await updateDsarRequest(requestId, updates);

  await logEvent(
    requestId,
    actor.id,
    legalHold ? "legal_hold_applied" : "legal_hold_removed",
    { reason: reason ?? null }
  );

  await auditDsar({
    eventType: legalHold
      ? AUDIT_EVENT_TYPES.DSAR_LEGAL_HOLD_APPLY
      : AUDIT_EVENT_TYPES.DSAR_LEGAL_HOLD_REMOVE,
    action: legalHold ? "apply_legal_hold" : "remove_legal_hold",
    actor,
    requestId,
    auditContext,
    metadata: {
      legalHold,
      requestType: request.request_type,
    },
  });

  if (notes) {
    await appendSanitizedAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  return loadAdminRequestDetail(updated);
}

export async function updateDsarStatus({
  actor,
  requestId,
  status,
  notes,
  auditContext = null,
}) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertStatusTransition(request.status, status);

  const oldStatus = request.status;

  const updated = await updateDsarRequest(requestId, {
    status,
    ...(status === "completed"
      ? { completedAt: new Date(), completedBy: actor.id }
      : {}),
  });

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_STATUS_CHANGE,
    action: "update_status",
    actor,
    requestId,
    auditContext,
    metadata: {
      requestType: request.request_type,
      oldStatus,
      newStatus: status,
    },
  });

  if (status === "denied") {
    await logEvent(requestId, actor.id, "denied", {});
    await auditDsar({
      eventType: AUDIT_EVENT_TYPES.DSAR_REQUEST_DENIED,
      action: "deny_request",
      actor,
      requestId,
      auditContext,
      metadata: { oldStatus, newStatus: status },
    });
  } else if (status === "cancelled") {
    await logEvent(requestId, actor.id, "cancelled", {});
  } else if (status === "completed" || status === "partially_completed") {
    await logEvent(requestId, actor.id, "completed", { status });
    await auditDsar({
      eventType: AUDIT_EVENT_TYPES.DSAR_REQUEST_COMPLETED,
      action: "complete_request",
      actor,
      requestId,
      auditContext,
      metadata: { oldStatus, newStatus: status },
    });
  }

  if (notes) {
    await appendSanitizedAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  return loadAdminRequestDetail(updated);
}

export async function addDsarAdminNote({ actor, requestId, note, auditContext = null }) {
  assertAdmin(actor);
  await getRequestForAdmin(requestId);
  const updated = await appendSanitizedAdminNotes(requestId, note);
  await logEvent(requestId, actor.id, "admin_note_added", {});
  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_ADMIN_NOTE,
    action: "add_note",
    actor,
    requestId,
    auditContext,
    metadata: {},
  });
  return loadAdminRequestDetail(updated);
}

export async function resolveDsarObjection({
  actor,
  requestId,
  accepted,
  notes,
  denialReason,
  auditContext = null,
}) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);

  if (request.request_type !== "objection") {
    throw dsarRequestNotFoundError();
  }

  assertIdentityVerified(request);

  if (accepted && request.requester_user_id) {
    await setUserProcessingRestriction({
      userId: request.requester_user_id,
      reason: notes
        ? textForAdminStorage(notes)
        : "Processing restricted per objection request",
      restricted: true,
    });
  }

  const status = accepted ? "completed" : "denied";

  const updated = await updateDsarRequest(requestId, {
    status,
    completedAt: new Date(),
    completedBy: actor.id,
    ...(accepted ? {} : { denialReason: denialReason ?? "Objection not accepted" }),
  });

  await logEvent(requestId, actor.id, "objection_resolved", { accepted });
  await logEvent(requestId, actor.id, status === "completed" ? "completed" : "denied", {});

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_OBJECTION_RESOLVED,
    action: accepted ? "accept_objection" : "deny_objection",
    actor,
    requestId,
    auditContext,
    metadata: { accepted, requestType: request.request_type },
  });

  if (notes) {
    await appendSanitizedAdminNotes(requestId, notes);
  }

  return loadAdminRequestDetail(updated);
}

export async function applyDsarCcpaOptOut({
  actor,
  requestId,
  notes,
  explanation,
  auditContext = null,
}) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);

  if (request.request_type !== "ccpa_opt_out") {
    throw dsarRequestNotFoundError();
  }

  if (request.requester_user_id) {
    await setUserCcpaSaleOptOut({
      userId: request.requester_user_id,
      reason: explanation ?? notes ?? "CCPA opt-out of sale/share",
    });
    const requester = await findUserById(request.requester_user_id);
    if (requester?.email) {
      const { suppressMarketingForUser } = await import("./email-compliance.service.js");
      await suppressMarketingForUser({
        userId: requester.id,
        email: requester.email,
        reason: "ccpa_opt_out",
        source: "dsar_ccpa_opt_out",
      });
    }
  } else if (request.requester_email) {
    const { recordEmailSuppression } = await import("./email-compliance.service.js");
    const { EMAIL_SUPPRESSION_REASONS, EMAIL_SUPPRESSION_SCOPES } = await import(
      "../constants/emailCompliance.js"
    );
    for (const scope of Object.values(EMAIL_SUPPRESSION_SCOPES)) {
      await recordEmailSuppression({
        email: request.requester_email,
        scope,
        reason: EMAIL_SUPPRESSION_REASONS.CCPA_OPT_OUT,
        source: "dsar_ccpa_opt_out",
      });
    }
  }

  const updated = await updateDsarRequest(requestId, {
    status: "completed",
    completedAt: new Date(),
    completedBy: actor.id,
  });

  await logEvent(requestId, actor.id, "ccpa_opt_out_recorded", {
    hasAccount: Boolean(request.requester_user_id),
  });
  await logEvent(requestId, actor.id, "completed", {});

  await auditDsar({
    eventType: AUDIT_EVENT_TYPES.DSAR_CCPA_OPT_OUT,
    action: "record_ccpa_opt_out",
    actor,
    requestId,
    auditContext,
    metadata: {
      requestType: request.request_type,
      targetUserId: request.requester_user_id,
    },
  });

  if (notes || explanation) {
    await appendSanitizedAdminNotes(
      requestId,
      [explanation, notes].filter(Boolean).join("\n")
    );
  }

  return loadAdminRequestDetail(updated);
}

export { buildUserDataExport, anonymizeUserRecord, mapDsarEventRow };
