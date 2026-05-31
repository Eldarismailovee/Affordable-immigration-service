import pool from "../db/pool.js";
import { query } from "../db/query.js";

export async function createAdminAuditLog(
  { id, userId, method, path, status, requestId },
  db = pool
) {
  await query(
    db,
    `
    INSERT INTO admin_audit_log (
      id, user_id, method, path, status, request_id
    ) VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [id, userId, method, path, status, requestId]
  );
}

export async function insertAuditEvent(
  {
    id,
    eventType,
    category,
    action,
    result,
    actorUserId,
    actorRole,
    targetType,
    targetId,
    requestId,
    ipHash,
    userAgent,
    reasonCode,
    metadataJson,
  },
  db = pool
) {
  await query(
    db,
    `
    INSERT INTO audit_events (
      id,
      event_type,
      category,
      action,
      result,
      actor_user_id,
      actor_role,
      target_type,
      target_id,
      request_id,
      ip_hash,
      user_agent,
      reason_code,
      metadata_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `,
    [
      id,
      eventType,
      category,
      action,
      result,
      actorUserId,
      actorRole,
      targetType,
      targetId,
      requestId,
      ipHash,
      userAgent,
      reasonCode,
      metadataJson,
    ]
  );
}

export async function listAuditEvents(
  {
    eventType,
    actorUserId,
    targetType,
    targetId,
    dateFrom,
    dateTo,
    limit = 50,
  },
  db = pool
) {
  const conditions = [];
  const params = [];
  let index = 1;

  if (eventType) {
    conditions.push(`event_type = $${index++}`);
    params.push(eventType);
  }

  if (actorUserId) {
    conditions.push(`actor_user_id = $${index++}`);
    params.push(actorUserId);
  }

  if (targetType) {
    conditions.push(`target_type = $${index++}`);
    params.push(targetType);
  }

  if (targetId) {
    conditions.push(`target_id = $${index++}`);
    params.push(targetId);
  }

  if (dateFrom) {
    conditions.push(`created_at >= $${index++}`);
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`created_at <= $${index++}`);
    params.push(dateTo);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  params.push(safeLimit);

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const { rows } = await query(
    db,
    `
    SELECT
      id,
      event_type,
      category,
      action,
      result,
      actor_user_id,
      actor_role,
      target_type,
      target_id,
      request_id,
      ip_hash,
      user_agent,
      reason_code,
      metadata_json,
      created_at
    FROM audit_events
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${index}
    `,
    params
  );

  return rows;
}
