import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { query } from "../db/query.js";
import { DSAR_REQUEST_FIELDS } from "../utils/dsar.js";

export async function createDsarRequest(
  {
    requesterUserId,
    requesterEmail,
    requestType,
    status,
    identityVerificationStatus,
    userMessage,
    requestedChanges,
  },
  db = pool
) {
  const id = randomUUID();
  const { rows } = await query(
    db,
    `
    INSERT INTO dsar_requests (
      id,
      requester_user_id,
      requester_email,
      request_type,
      status,
      identity_verification_status,
      user_message,
      requested_changes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${DSAR_REQUEST_FIELDS}
    `,
    [
      id,
      requesterUserId,
      requesterEmail,
      requestType,
      status,
      identityVerificationStatus,
      userMessage ?? null,
      requestedChanges ?? null,
    ]
  );

  return rows[0];
}

export async function findDsarRequestById(requestId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${DSAR_REQUEST_FIELDS}
    FROM dsar_requests
    WHERE id = $1
    LIMIT 1
    `,
    [requestId]
  );

  return rows[0] || null;
}

export async function listDsarRequestsByUserId(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${DSAR_REQUEST_FIELDS}
    FROM dsar_requests
    WHERE requester_user_id = $1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return rows;
}

export async function listDsarRequestsForAccount({ userId, email }, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${DSAR_REQUEST_FIELDS}
    FROM dsar_requests
    WHERE requester_user_id = $1
       OR (requester_user_id IS NULL AND LOWER(requester_email) = LOWER($2))
    ORDER BY created_at DESC
    `,
    [userId, email]
  );

  return rows;
}

export async function listAllDsarRequests(db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${DSAR_REQUEST_FIELDS}
    FROM dsar_requests
    ORDER BY created_at DESC
    LIMIT 500
    `
  );

  return rows;
}

export async function updateDsarRequest(requestId, fields, db = pool) {
  const sets = [];
  const params = [requestId];
  let index = 2;

  const columnMap = {
    status: "status",
    identityVerificationStatus: "identity_verification_status",
    identityVerifiedAt: "identity_verified_at",
    identityVerifiedBy: "identity_verified_by",
    legalHold: "legal_hold",
    legalHoldReason: "legal_hold_reason",
    legalHoldAppliedBy: "legal_hold_applied_by",
    legalHoldAppliedAt: "legal_hold_applied_at",
    adminNotes: "admin_notes",
    exportPayloadJson: "export_payload_json",
    exportPdfPath: "export_pdf_path",
    exportGeneratedAt: "export_generated_at",
    denialReason: "denial_reason",
    completedAt: "completed_at",
    completedBy: "completed_by",
  };

  for (const [key, column] of Object.entries(columnMap)) {
    if (fields[key] !== undefined) {
      sets.push(`${column} = $${index}`);
      const value = fields[key];
      params.push(value);
      index += 1;
    }
  }

  if (sets.length === 0) {
    return findDsarRequestById(requestId, db);
  }

  const { rows } = await query(
    db,
    `
    UPDATE dsar_requests
    SET ${sets.join(", ")}, updated_at = NOW()
    WHERE id = $1
    RETURNING ${DSAR_REQUEST_FIELDS}
    `,
    params
  );

  return rows[0] || null;
}

export async function appendAdminNotes(requestId, note, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE dsar_requests
    SET
      admin_notes = CASE
        WHEN admin_notes IS NULL OR admin_notes = '' THEN $2
        ELSE admin_notes || E'\n' || $2
      END,
      updated_at = NOW()
    WHERE id = $1
    RETURNING ${DSAR_REQUEST_FIELDS}
    `,
    [requestId, note]
  );

  return rows[0] || null;
}

export async function createDsarEvent(
  { dsarRequestId, actorUserId, eventType, metadata },
  db = pool
) {
  const id = randomUUID();
  const { rows } = await query(
    db,
    `
    INSERT INTO dsar_request_events (
      id,
      dsar_request_id,
      actor_user_id,
      event_type,
      metadata_json
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING id, dsar_request_id, actor_user_id, event_type, metadata_json, created_at
    `,
    [
      id,
      dsarRequestId,
      actorUserId ?? null,
      eventType,
      metadata ?? null,
    ]
  );

  return rows[0];
}

export async function listDsarEventsByRequestId(requestId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT id, dsar_request_id, actor_user_id, event_type, metadata_json, created_at
    FROM dsar_request_events
    WHERE dsar_request_id = $1
    ORDER BY created_at ASC
    `,
    [requestId]
  );

  return rows;
}
