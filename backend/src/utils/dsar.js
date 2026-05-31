import { DSAR_STATUS_TRANSITIONS } from "../constants/dsar.js";
import {
  dsarIdentityNotVerifiedError,
  dsarInvalidStatusTransitionError,
  dsarLegalHoldError,
} from "../domain/errors.js";
import { sanitizeUser } from "./auth.js";

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
  user_message,
  requested_changes,
  export_payload_json,
  completed_at,
  completed_by,
  created_at,
  updated_at
`;

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
    };
  }

  const admin = {
    ...base,
    requesterUserId: row.requester_user_id,
    requesterEmail: row.requester_email,
    adminNotes: row.admin_notes ?? null,
    legalHoldReason: row.legal_hold_reason ?? null,
    identityVerifiedAt: row.identity_verified_at ?? null,
    requestedChanges: row.requested_changes ?? null,
    hasExport: Boolean(row.export_payload_json),
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
