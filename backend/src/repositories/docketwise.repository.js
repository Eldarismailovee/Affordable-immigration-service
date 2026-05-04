import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { withTransaction } from "../db/transaction.js";
import { NOT_SYNCED_STATUS, SYNCED_STATUS } from "../constants/domain.js";
import { updateIntakeDocketwiseStatusByLeadId } from "./lead.repository.js";

const SYNC_FIELDS = "id, lead_id, external_id, status, error_message, last_synced_at, created_at";

export async function createDocketwiseSyncRecord(
  {
    id,
    leadId,
    externalId = null,
    status = NOT_SYNCED_STATUS,
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

export async function syncDocketwiseForLead({
  leadId,
  existingSync,
  externalId,
  lastSyncedAt,
}) {
  return withTransaction(async (client) => {
    const syncRow = existingSync
      ? await updateDocketwiseSyncById(
          existingSync.id,
          {
            externalId,
            status: SYNCED_STATUS,
            errorMessage: null,
            lastSyncedAt,
          },
          client
        )
      : await createDocketwiseSyncRecord(
          {
            id: randomUUID(),
            leadId,
            externalId,
            status: SYNCED_STATUS,
            errorMessage: null,
            lastSyncedAt,
          },
          client
        );

    await updateIntakeDocketwiseStatusByLeadId(leadId, SYNCED_STATUS, client);
    return syncRow;
  });
}
