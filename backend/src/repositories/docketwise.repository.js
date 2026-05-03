import pool from "../db/pool.js";

const SYNC_FIELDS = "id, lead_id, external_id, status, error_message, last_synced_at, created_at";

export async function createDocketwiseSyncRecord(
  {
    id,
    leadId,
    externalId = null,
    status = "not_synced",
    errorMessage = null,
    lastSyncedAt = null,
  },
  db = pool
) {
  const { rows } = await db.query(
    `
    INSERT INTO docketwise_sync (
      id, lead_id, external_id, status, error_message, last_synced_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${SYNC_FIELDS}
    `,
    [id, leadId, externalId, status, errorMessage, lastSyncedAt]
  );

  return rows[0];
}

export async function updateDocketwiseSyncById(
  id,
  { externalId, status, errorMessage, lastSyncedAt },
  db = pool
) {
  const { rows } = await db.query(
    `
    UPDATE docketwise_sync
    SET
      external_id = $2,
      status = $3,
      error_message = $4,
      last_synced_at = $5
    WHERE id = $1
    RETURNING ${SYNC_FIELDS}
    `,
    [id, externalId, status, errorMessage, lastSyncedAt]
  );

  return rows[0] || null;
}
