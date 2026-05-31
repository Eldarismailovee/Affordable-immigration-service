import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { query } from "../db/query.js";

const SUPPRESSION_FIELDS =
  "id, email_normalized, email_hash, reason, source, scope, user_id, token_hash, metadata_json, created_at, updated_at";

export async function findSuppressionByEmailHashAndScope(emailHash, scope, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${SUPPRESSION_FIELDS}
    FROM email_suppressions
    WHERE email_hash = $1
      AND scope = $2
    LIMIT 1
    `,
    [emailHash, scope]
  );

  return rows[0] || null;
}

export async function listSuppressionsByEmailHash(emailHash, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${SUPPRESSION_FIELDS}
    FROM email_suppressions
    WHERE email_hash = $1
    `,
    [emailHash]
  );

  return rows;
}

export async function upsertEmailSuppression(
  {
    emailNormalized,
    emailHash,
    reason,
    source,
    scope,
    userId = null,
    tokenHash = null,
    metadataJson = {},
  },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    INSERT INTO email_suppressions (
      id,
      email_normalized,
      email_hash,
      reason,
      source,
      scope,
      user_id,
      token_hash,
      metadata_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (email_hash, scope)
    DO UPDATE SET
      reason = EXCLUDED.reason,
      source = EXCLUDED.source,
      user_id = COALESCE(EXCLUDED.user_id, email_suppressions.user_id),
      token_hash = COALESCE(EXCLUDED.token_hash, email_suppressions.token_hash),
      metadata_json = email_suppressions.metadata_json || EXCLUDED.metadata_json,
      updated_at = NOW()
    RETURNING ${SUPPRESSION_FIELDS}
    `,
    [
      randomUUID(),
      emailNormalized,
      emailHash,
      reason,
      source,
      scope,
      userId,
      tokenHash,
      JSON.stringify(metadataJson),
    ]
  );

  return rows[0];
}

export async function deleteSuppressionByEmailHashAndScope(emailHash, scope, db = pool) {
  const { rowCount } = await query(
    db,
    `
    DELETE FROM email_suppressions
    WHERE email_hash = $1
      AND scope = $2
    `,
    [emailHash, scope]
  );

  return rowCount > 0;
}
