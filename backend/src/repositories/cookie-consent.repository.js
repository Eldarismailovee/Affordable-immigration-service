import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { query } from "../db/query.js";

export async function createCookieConsentLog(
  {
    userId,
    anonymousId,
    consentVersion,
    strictlyNecessary,
    analytics,
    marketing,
    source,
    regionHint,
    userAgentHash,
    ipHash,
  },
  db = pool
) {
  const id = randomUUID();
  const { rows } = await query(
    db,
    `
    INSERT INTO cookie_consent_logs (
      id,
      user_id,
      anonymous_id,
      consent_version,
      strictly_necessary,
      analytics,
      marketing,
      source,
      region_hint,
      user_agent_hash,
      ip_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING id, created_at
    `,
    [
      id,
      userId ?? null,
      anonymousId ?? null,
      consentVersion,
      strictlyNecessary,
      analytics,
      marketing,
      source,
      regionHint ?? null,
      userAgentHash ?? null,
      ipHash ?? null,
    ]
  );

  return rows[0];
}
