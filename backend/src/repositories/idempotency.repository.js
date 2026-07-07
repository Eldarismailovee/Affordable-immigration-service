import { query } from "../db/query.js";
import pool from "../db/pool.js";
import { IDEMPOTENCY_STATES } from "../constants/idempotency.js";

function mapRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    actorScope: row.actor_scope,
    operation: row.operation,
    idempotencyKeyHash: row.idempotency_key_hash,
    requestHash: row.request_hash,
    state: row.state,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    httpStatus: row.http_status,
    responseBody: row.response_body,
    errorCode: row.error_code,
    lockedAt: row.locked_at,
    completedAt: row.completed_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertIdempotencyProcessing(
  {
    actorScope,
    operation,
    idempotencyKeyHash,
    requestHash,
    expiresAt,
  },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    INSERT INTO idempotency_records (
      actor_scope,
      operation,
      idempotency_key_hash,
      request_hash,
      state,
      locked_at,
      expires_at
    )
    VALUES ($1, $2, $3, $4, $5, NOW(), $6)
    ON CONFLICT (actor_scope, operation, idempotency_key_hash) DO NOTHING
    RETURNING *
    `,
    [
      actorScope,
      operation,
      idempotencyKeyHash,
      requestHash,
      IDEMPOTENCY_STATES.PROCESSING,
      expiresAt,
    ],
    { name: "idempotency.insert-processing" }
  );

  return mapRow(rows[0]);
}

export async function findIdempotencyRecordForUpdate(
  { actorScope, operation, idempotencyKeyHash },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    SELECT *
    FROM idempotency_records
    WHERE actor_scope = $1
      AND operation = $2
      AND idempotency_key_hash = $3
    FOR UPDATE
    `,
    [actorScope, operation, idempotencyKeyHash],
    { name: "idempotency.find-for-update" }
  );

  return mapRow(rows[0]);
}

export async function completeIdempotencyRecord(
  {
    id,
    resourceType,
    resourceId,
    httpStatus,
    responseBody,
    expiresAt,
  },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE idempotency_records
    SET
      state = $2,
      resource_type = $3,
      resource_id = $4,
      http_status = $5,
      response_body = $6,
      completed_at = NOW(),
      expires_at = $7,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      IDEMPOTENCY_STATES.COMPLETED,
      resourceType ?? null,
      resourceId ?? null,
      httpStatus,
      responseBody,
      expiresAt,
    ],
    { name: "idempotency.complete" }
  );

  return mapRow(rows[0]);
}

export async function markIdempotencyFailedRetryable({ id, errorCode }, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE idempotency_records
    SET
      state = $2,
      error_code = $3,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id, IDEMPOTENCY_STATES.FAILED_RETRYABLE, errorCode ?? null],
    { name: "idempotency.failed-retryable" }
  );

  return mapRow(rows[0]);
}

export async function markIdempotencyFailedTerminal(
  { id, httpStatus, responseBody, errorCode, expiresAt },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE idempotency_records
    SET
      state = $2,
      http_status = $3,
      response_body = $4,
      error_code = $5,
      completed_at = NOW(),
      expires_at = $6,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      id,
      IDEMPOTENCY_STATES.FAILED_TERMINAL,
      httpStatus,
      responseBody,
      errorCode ?? null,
      expiresAt,
    ],
    { name: "idempotency.failed-terminal" }
  );

  return mapRow(rows[0]);
}

export async function deleteExpiredIdempotencyRecords({ limit = 500, now = new Date() }, db = pool) {
  const { rows } = await query(
    db,
    `
    DELETE FROM idempotency_records
    WHERE id IN (
      SELECT id
      FROM idempotency_records
      WHERE expires_at <= $1
        AND state IN ('completed', 'failed_terminal', 'failed_retryable')
      ORDER BY expires_at ASC
      LIMIT $2
    )
    RETURNING id
    `,
    [now, limit],
    { name: "idempotency.cleanup-expired" }
  );

  return rows.map((row) => row.id);
}

export async function reclaimStaleProcessingRecord({ id }, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE idempotency_records
    SET
      state = $2,
      error_code = 'stale_processing',
      updated_at = NOW()
    WHERE id = $1
      AND state = $3
    RETURNING *
    `,
    [id, IDEMPOTENCY_STATES.FAILED_RETRYABLE, IDEMPOTENCY_STATES.PROCESSING],
    { name: "idempotency.reclaim-stale" }
  );

  return mapRow(rows[0]);
}

export async function reacquireIdempotencyRecord(
  { id, requestHash, expiresAt },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE idempotency_records
    SET
      state = $2,
      request_hash = $3,
      locked_at = NOW(),
      expires_at = $4,
      http_status = NULL,
      response_body = NULL,
      error_code = NULL,
      completed_at = NULL,
      resource_type = NULL,
      resource_id = NULL,
      updated_at = NOW()
    WHERE id = $1
      AND state = $5
      AND request_hash = $3
    RETURNING *
    `,
    [
      id,
      IDEMPOTENCY_STATES.PROCESSING,
      requestHash,
      expiresAt,
      IDEMPOTENCY_STATES.FAILED_RETRYABLE,
    ],
    { name: "idempotency.reacquire" }
  );

  return mapRow(rows[0]);
}
