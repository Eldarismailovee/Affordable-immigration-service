import { DSAR_TYPES_REQUIRING_IDENTITY } from "../constants/dsar.js";
import {
  dsarAccessDeniedError,
  dsarExportNotAvailableError,
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
  listDsarRequestsByUserId,
  updateDsarRequest,
} from "../repositories/dsar.repository.js";
import {
  setUserProcessingRestriction,
  updateUserFullNameById,
} from "../repositories/user.repository.js";
import {
  assertIdentityVerified,
  assertNoLegalHold,
  assertStatusTransition,
  mapDsarEventRow,
  mapDsarRequestRow,
} from "../utils/dsar.js";
import { anonymizeUserRecord } from "./dsar-anonymization.service.js";
import { buildUserDataExport } from "./dsar-export.service.js";

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

async function getRequestForUser(requestId, userId) {
  const request = await findDsarRequestById(requestId);

  if (!request) {
    throw dsarRequestNotFoundError();
  }

  if (request.requester_user_id !== userId) {
    throw dsarAccessDeniedError();
  }

  return request;
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

export async function createUserDsarRequest({ user, type, message, requestedChanges }) {
  assertAuthenticated(user);

  const status = initialStatusForType(type);
  const row = await createDsarRequest({
    requesterUserId: user.id,
    requesterEmail: user.email,
    requestType: type,
    status,
    identityVerificationStatus: initialIdentityStatus(),
    userMessage: message,
    requestedChanges,
  });

  await logEvent(row.id, user.id, "submitted", { type });

  if (status === "identity_verification_required") {
    await logEvent(row.id, user.id, "identity_verification_requested", { type });
  }

  return mapDsarRequestRow(row);
}

export async function listUserDsarRequests(userId) {
  const rows = await listDsarRequestsByUserId(userId);
  return rows.map((row) => mapDsarRequestRow(row));
}

export async function getUserDsarRequest({ userId, requestId }) {
  const request = await getRequestForUser(requestId, userId);
  return mapDsarRequestRow(request);
}

export async function getUserDsarExport({ userId, requestId }) {
  const request = await getRequestForUser(requestId, userId);

  if (request.request_type !== "export") {
    throw dsarExportNotAvailableError();
  }

  assertIdentityVerified(request);

  const payload =
    typeof request.export_payload_json === "string"
      ? JSON.parse(request.export_payload_json)
      : request.export_payload_json;

  if (payload) {
    return {
      generatedAt: payload.generatedAt,
      export: payload,
    };
  }

  throw dsarExportNotAvailableError();
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

export async function verifyDsarIdentity({ actor, requestId, status, notes }) {
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
  }

  if (notes) {
    await appendAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  const updated = await updateDsarRequest(requestId, updates);
  return loadAdminRequestDetail(updated);
}

export async function generateDsarExport({ actor, requestId }) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);

  const exportPayload = await buildUserDataExport(request.requester_user_id);

  const updated = await updateDsarRequest(requestId, {
    exportPayloadJson: exportPayload,
    status: "action_required",
  });

  await logEvent(requestId, actor.id, "export_generated", {
    fieldNames: Object.keys(exportPayload),
  });

  return loadAdminRequestDetail(updated);
}

export async function applyDsarCorrection({ actor, requestId, userFields, leadFields, notes }) {
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

  if (notes) {
    await appendAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  return loadAdminRequestDetail(updated);
}

export async function applyDsarAnonymization({ actor, requestId, notes }) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);
  assertNoLegalHold(request);

  if (!["deletion", "anonymization"].includes(request.request_type)) {
    throw dsarRequestNotFoundError();
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

  if (notes) {
    await appendAdminNotes(requestId, notes);
  }

  return loadAdminRequestDetail(updated);
}

export async function applyDsarRestriction({ actor, requestId, notes }) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertIdentityVerified(request);

  await setUserProcessingRestriction({
    userId: request.requester_user_id,
    reason: notes || "DSAR restriction request",
    restricted: true,
  });

  const updated = await updateDsarRequest(requestId, {
    status: "completed",
    completedAt: new Date(),
    completedBy: actor.id,
  });

  await logEvent(requestId, actor.id, "restriction_applied", {});
  await logEvent(requestId, actor.id, "completed", {});

  if (notes) {
    await appendAdminNotes(requestId, notes);
  }

  return loadAdminRequestDetail(updated);
}

export async function updateDsarLegalHold({ actor, requestId, legalHold, reason, notes }) {
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

  if (notes) {
    await appendAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  return loadAdminRequestDetail(updated);
}

export async function updateDsarStatus({ actor, requestId, status, notes }) {
  assertAdmin(actor);
  const request = await getRequestForAdmin(requestId);
  assertStatusTransition(request.status, status);

  const updated = await updateDsarRequest(requestId, {
    status,
    ...(status === "completed"
      ? { completedAt: new Date(), completedBy: actor.id }
      : {}),
  });

  if (status === "denied") {
    await logEvent(requestId, actor.id, "denied", {});
  } else if (status === "cancelled") {
    await logEvent(requestId, actor.id, "cancelled", {});
  } else if (status === "completed") {
    await logEvent(requestId, actor.id, "completed", {});
  }

  if (notes) {
    await appendAdminNotes(requestId, notes);
    await logEvent(requestId, actor.id, "admin_note_added", {});
  }

  return loadAdminRequestDetail(updated);
}

export async function addDsarAdminNote({ actor, requestId, note }) {
  assertAdmin(actor);
  await getRequestForAdmin(requestId);
  const updated = await appendAdminNotes(requestId, note);
  await logEvent(requestId, actor.id, "admin_note_added", {});
  return loadAdminRequestDetail(updated);
}

export { buildUserDataExport, anonymizeUserRecord, mapDsarEventRow };
