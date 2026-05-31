import {
  DSAR_CORRECTABLE_LEAD_FIELDS,
  DSAR_CORRECTABLE_USER_FIELDS,
  DSAR_DELETION_REQUEST_TYPES,
  DSAR_EXPORT_REQUEST_TYPES,
  DSAR_FORBIDDEN_CORRECTION_FIELDS,
  DSAR_LEGACY_REQUEST_TYPES,
  DSAR_STATUS_TRANSITIONS,
} from "../constants/dsar.js";
import {
  dsarIdentityNotVerifiedError,
  dsarInvalidCorrectionFieldsError,
  dsarInvalidStatusTransitionError,
  dsarLegalHoldError,
} from "../domain/errors.js";
import { sanitizeUser } from "./auth.js";

const LEGACY_TYPE_ALIASES = {
  export: "access",
  anonymization: "deletion",
};

const DSAR_REQUEST_FIELDS = `
  id,
  requester_user_id,
  requester_email,
  request_type,
  status,
  identity_verification_status,
  identity_verified_at,
  identity_verified_by,
  legal_hold,
  legal_hold_reason,
  legal_hold_applied_by,
  legal_hold_applied_at,
  admin_notes,
  denial_reason,
  user_message,
  requested_changes,
  export_payload_json,
  export_pdf_path,
  export_generated_at,
  completed_at,
  completed_by,
  created_at,
  updated_at
`;

export function normalizeRequestType(type) {
  return LEGACY_TYPE_ALIASES[type] ?? type;
}

export function isExportRequestType(type) {
  const normalized = normalizeRequestType(type);
  return DSAR_EXPORT_REQUEST_TYPES.includes(normalized);
}

export function isDeletionRequestType(type) {
  const normalized = normalizeRequestType(type);
  return DSAR_DELETION_REQUEST_TYPES.includes(normalized);
}

export function acceptsLegacyRequestType(type) {
  return DSAR_LEGACY_REQUEST_TYPES.includes(type);
}

export function assertAllowedCorrectionFields(requestedChanges) {
  if (!requestedChanges || typeof requestedChanges !== "object") {
    return;
  }

  const keys = Object.keys(requestedChanges);
  const allowed = new Set([
    ...DSAR_CORRECTABLE_USER_FIELDS,
    ...DSAR_CORRECTABLE_LEAD_FIELDS,
  ]);

  for (const key of keys) {
    const lower = key.toLowerCase();
    if (DSAR_FORBIDDEN_CORRECTION_FIELDS.some((f) => lower.includes(f))) {
      throw dsarInvalidCorrectionFieldsError(key);
    }
    if (!allowed.has(key)) {
      throw dsarInvalidCorrectionFieldsError(key);
    }
  }
}

export { DSAR_REQUEST_FIELDS };

export function mapDsarRequestRow(row, { includeAdmin = false, includeEvents = false } = {}) {
  if (!row) return null;

  const base = {
    id: row.id,
    type: row.request_type,
    status: row.status,
    identityVerificationStatus: row.identity_verification_status,
    legalHold: Boolean(row.legal_hold),
    userMessage: row.user_message ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? null,
  };

  if (!includeAdmin) {
    return {
      ...base,
      requestedChanges: row.requested_changes ?? null,
      hasExport: Boolean(row.export_payload_json),
      hasExportPdf: Boolean(row.export_pdf_path),
    };
  }

  const admin = {
    ...base,
    requesterUserId: row.requester_user_id ?? null,
    requesterEmail: row.requester_email,
    adminNotes: row.admin_notes ?? null,
    denialReason: row.denial_reason ?? null,
    legalHoldReason: row.legal_hold_reason ?? null,
    identityVerifiedAt: row.identity_verified_at ?? null,
    requestedChanges: row.requested_changes ?? null,
    hasExport: Boolean(row.export_payload_json),
    hasExportPdf: Boolean(row.export_pdf_path),
    exportGeneratedAt: row.export_generated_at ?? null,
  };

  if (includeEvents && row.events) {
    admin.events = row.events.map(mapDsarEventRow);
  }

  return admin;
}

export function mapDsarEventRow(row) {
  return {
    id: row.id,
    eventType: row.event_type,
    actorUserId: row.actor_user_id ?? null,
    metadata: row.metadata_json ?? null,
    createdAt: row.created_at,
  };
}

export function assertStatusTransition(currentStatus, nextStatus) {
  const allowed = DSAR_STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    throw dsarInvalidStatusTransitionError();
  }
}

export function assertIdentityVerified(request) {
  if (request.identity_verification_status !== "verified") {
    throw dsarIdentityNotVerifiedError();
  }
}

export function assertNoLegalHold(request) {
  if (request.legal_hold) {
    throw dsarLegalHoldError();
  }
}

export function stripSecretsFromExportUser(user) {
  if (!user) return null;
  return sanitizeUser(user);
}
