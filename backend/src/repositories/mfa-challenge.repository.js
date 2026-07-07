import pool from "../db/pool.js";
import { query } from "../db/query.js";

const CHALLENGE_FIELDS = `
  id,
  user_id,
  purpose,
  token_hash,
  attempts,
  expires_at,
  consumed_at,
  created_at
`;

export async function createMfaChallenge(
  { id, userId, purpose, tokenHash, expiresAt },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    INSERT INTO auth_mfa_challenges (
      id,
      user_id,
      purpose,
      token_hash,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING ${CHALLENGE_FIELDS}
    `,
    [id, userId, purpose, tokenHash, expiresAt]
  );

  return rows[0];
}

export async function findMfaChallengeByTokenHash(tokenHash, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${CHALLENGE_FIELDS}
    FROM auth_mfa_challenges
    WHERE token_hash = $1
    LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] || null;
}

export async function incrementMfaChallengeAttempts(challengeId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE auth_mfa_challenges
    SET attempts = attempts + 1
    WHERE id = $1
      AND consumed_at IS NULL
    RETURNING ${CHALLENGE_FIELDS}
    `,
    [challengeId]
  );

  return rows[0] || null;
}

export async function consumeMfaChallenge(challengeId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE auth_mfa_challenges
    SET consumed_at = NOW()
    WHERE id = $1
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING ${CHALLENGE_FIELDS}
    `,
    [challengeId]
  );

  return rows[0] || null;
}

export async function invalidateMfaChallenge(challengeId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE auth_mfa_challenges
    SET consumed_at = COALESCE(consumed_at, NOW())
    WHERE id = $1
    RETURNING ${CHALLENGE_FIELDS}
    `,
    [challengeId]
  );

  return rows[0] || null;
}

export async function invalidateUserMfaChallenges(userId, db = pool) {
  await query(
    db,
    `
    UPDATE auth_mfa_challenges
    SET consumed_at = COALESCE(consumed_at, NOW())
    WHERE user_id = $1
      AND consumed_at IS NULL
    `,
    [userId]
  );
}
