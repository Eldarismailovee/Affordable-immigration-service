import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import {
  createAdminAuditLog,
  insertAuditEvent,
  listAuditEvents,
} from "../repositories/audit.repository.js";
import { sanitizeAuditMetadata } from "../utils/auditRedaction.js";
import { logger } from "../lib/logger.js";

function mapAuditEventRow(row) {
  return {
    id: row.id,
    eventType: row.event_type,
    category: row.category,
    action: row.action,
    result: row.result,
    actorUserId: row.actor_user_id,
    actorRole: row.actor_role,
    targetType: row.target_type,
    targetId: row.target_id,
    requestId: row.request_id,
    ipHash: row.ip_hash,
    userAgent: row.user_agent,
    reasonCode: row.reason_code,
    metadata: row.metadata_json,
    createdAt: row.created_at,
  };
}

export async function recordAdminAction({ userId, method, path, status, requestId }) {
  await createAdminAuditLog({
    id: randomUUID(),
    userId,
    method,
    path,
    status,
    requestId,
  });
}

export async function recordAuditEvent(
  {
    eventType,
    category,
    action,
    result,
    actorUserId = null,
    actorRole = null,
    targetType = null,
    targetId = null,
    request = null,
    reasonCode = null,
    metadata = {},
  },
  db = pool
) {
  try {
    await insertAuditEvent(
      {
        id: randomUUID(),
        eventType,
        category,
        action,
        result,
        actorUserId,
        actorRole,
        targetType,
        targetId,
        requestId: request?.requestId ?? null,
        ipHash: request?.ipHash ?? null,
        userAgent: request?.userAgent ?? null,
        reasonCode,
        metadataJson: sanitizeAuditMetadata(metadata),
      },
      db
    );
  } catch (err) {
    if (db !== pool) {
      throw err;
    }

    logger.error({ err, eventType, category, action }, "Failed to write audit event");
  }
}

export async function listAdminAuditEvents(filters) {
  const rows = await listAuditEvents(filters);
  return rows.map(mapAuditEventRow);
}
