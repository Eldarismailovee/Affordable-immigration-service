import pool from "../db/pool.js";
import { query } from "../db/query.js";

const DRAFT_TTL_DAYS = 30;

function mapDraftRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    schemaVersion: row.schema_version,
    version: row.version,
    data: row.draft_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at,
  };
}

export async function findIntakeDraftByUserId(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT *
    FROM intake_drafts
    WHERE user_id = $1
      AND submitted_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
    `,
    [userId]
  );

  return mapDraftRow(rows[0]);
}

export async function upsertIntakeDraft({ userId, data, expectedVersion = null }, db = pool) {
  const existing = await findIntakeDraftByUserId(userId, db);

  if (existing && expectedVersion !== null && existing.version !== expectedVersion) {
    return { conflict: true, draft: existing };
  }

  if (existing) {
    const { rows } = await query(
      db,
      `
      UPDATE intake_drafts
      SET
        draft_data = $3::jsonb,
        version = version + 1,
        updated_at = NOW(),
        expires_at = NOW() + ($4 || ' days')::interval
      WHERE user_id = $1
        AND version = $2
        AND submitted_at IS NULL
      RETURNING *
      `,
      [userId, existing.version, JSON.stringify(data), String(DRAFT_TTL_DAYS)]
    );

    if (!rows[0]) {
      const latest = await findIntakeDraftByUserId(userId, db);
      return { conflict: true, draft: latest };
    }

    return { conflict: false, draft: mapDraftRow(rows[0]) };
  }

  const { rows } = await query(
    db,
    `
    INSERT INTO intake_drafts (user_id, draft_data, expires_at)
    VALUES ($1, $2::jsonb, NOW() + ($3 || ' days')::interval)
    ON CONFLICT (user_id) DO UPDATE
    SET
      draft_data = EXCLUDED.draft_data,
      version = intake_drafts.version + 1,
      updated_at = NOW(),
      expires_at = EXCLUDED.expires_at,
      submitted_at = NULL
    RETURNING *
    `,
    [userId, JSON.stringify(data), String(DRAFT_TTL_DAYS)]
  );

  return { conflict: false, draft: mapDraftRow(rows[0]) };
}

export async function deleteIntakeDraftForUser(userId, db = pool) {
  await query(
    db,
    `
    DELETE FROM intake_drafts
    WHERE user_id = $1
    `,
    [userId]
  );
}

export async function markIntakeDraftSubmitted(userId, db = pool) {
  await query(
    db,
    `
    UPDATE intake_drafts
    SET submitted_at = NOW(), updated_at = NOW()
    WHERE user_id = $1
      AND submitted_at IS NULL
    `,
    [userId]
  );
}

export async function deleteExpiredIntakeDrafts(db = pool) {
  const { rowCount } = await query(
    db,
    `
    DELETE FROM intake_drafts
    WHERE expires_at <= NOW()
      AND submitted_at IS NULL
    `
  );

  return rowCount ?? 0;
}

export async function deleteIntakeDraftsForUser(userId, db = pool) {
  await deleteIntakeDraftForUser(userId, db);
}
