import { randomUUID } from "crypto";
import pool from "../db/pool.js";

export async function syncLeadToDocketwise(leadId) {
  const client = await pool.connect();

  try {
    const leadResult = await client.query(
      `
      SELECT id, first_name, last_name, email, phone
      FROM leads
      WHERE id = $1
      LIMIT 1
      `,
      [leadId]
    );

    if (leadResult.rows.length === 0) {
      throw new Error("Lead not found");
    }

    const intakeResult = await client.query(
      `
      SELECT id, selected_package, case_type
      FROM intakes
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [leadId]
    );

    if (intakeResult.rows.length === 0) {
      throw new Error("Intake record not found for this lead");
    }

    const existingSyncResult = await client.query(
      `
      SELECT id, lead_id, external_id, status, error_message, last_synced_at, created_at
      FROM docketwise_sync
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [leadId]
    );

    const externalId = `DW-${leadId.split("-")[0].toUpperCase()}`;
    const now = new Date();

    let syncRow;

    if (existingSyncResult.rows.length > 0) {
      const existing = existingSyncResult.rows[0];

      const updateResult = await client.query(
        `
        UPDATE docketwise_sync
        SET
          external_id = $2,
          status = $3,
          error_message = $4,
          last_synced_at = $5
        WHERE id = $1
        RETURNING id, lead_id, external_id, status, error_message, last_synced_at, created_at
        `,
        [existing.id, externalId, "synced", null, now]
      );

      syncRow = updateResult.rows[0];
    } else {
      const syncId = randomUUID();

      const insertResult = await client.query(
        `
        INSERT INTO docketwise_sync (
          id, lead_id, external_id, status, error_message, last_synced_at
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, lead_id, external_id, status, error_message, last_synced_at, created_at
        `,
        [syncId, leadId, externalId, "synced", null, now]
      );

      syncRow = insertResult.rows[0];
    }

    await client.query(
      `
      UPDATE intakes
      SET docketwise_status = 'synced'
      WHERE lead_id = $1
      `,
      [leadId]
    );

    return {
      success: true,
      provider: "Docketwise",
      message: "Lead marked as synced with Docketwise",
      sync: syncRow,
    };
  } finally {
    client.release();
  }
}
