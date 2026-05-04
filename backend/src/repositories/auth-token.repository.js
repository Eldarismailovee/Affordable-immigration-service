import pool from "../db/pool.js";
import { query } from "../db/query.js";
import { withTransaction } from "../db/transaction.js";

const REFRESH_TOKEN_FIELDS = `
  id,
  user_id,
  token_hash,
  replaced_by_token_id,
  user_agent,
  ip_address,
  revoked_at,
  expires_at,
  last_used_at,
  created_at
`;

const ONE_TIME_TOKEN_FIELDS = `
  id,
  user_id,
  token_hash,
  consumed_at,
  expires_at,
  created_at
`;

export async function createRefreshToken(
  { id, userId, tokenHash, expiresAt, userAgent = "", ipAddress = "" },
  db = pool
) {
  const { rows } = await query(db, 
    `
    INSERT INTO auth_refresh_tokens (
      id,
      user_id,
      token_hash,
      expires_at,
      user_agent,
      ip_address
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${REFRESH_TOKEN_FIELDS}
    `,
    [id, userId, tokenHash, expiresAt, userAgent, ipAddress]
  );

  return rows[0];
}

export async function findRefreshTokenByHash(tokenHash, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT ${REFRESH_TOKEN_FIELDS}
    FROM auth_refresh_tokens
    WHERE token_hash = $1
    LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] || null;
}

export async function rotateRefreshToken(
  { currentTokenId, nextTokenId, userId, tokenHash, expiresAt, userAgent, ipAddress },
  db = pool
) {
  return withTransaction(async (client) => {
    const nextToken = await createRefreshToken(
      {
        id: nextTokenId,
        userId,
        tokenHash,
        expiresAt,
        userAgent,
        ipAddress,
      },
      client
    );

    await query(client, 
      `
      UPDATE auth_refresh_tokens
      SET
        revoked_at = NOW(),
        replaced_by_token_id = $2,
        last_used_at = NOW()
      WHERE id = $1
      `,
      [currentTokenId, nextTokenId]
    );

    return nextToken;
  });
}

export async function revokeRefreshTokenByHash(tokenHash, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE auth_refresh_tokens
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE token_hash = $1
    RETURNING ${REFRESH_TOKEN_FIELDS}
    `,
    [tokenHash]
  );

  return rows[0] || null;
}

export async function revokeUserRefreshTokens(userId, db = pool) {
  await query(db, 
    `
    UPDATE auth_refresh_tokens
    SET revoked_at = COALESCE(revoked_at, NOW())
    WHERE user_id = $1
      AND revoked_at IS NULL
    `,
    [userId]
  );
}

export async function createEmailVerificationToken(
  { id, userId, tokenHash, expiresAt },
  db = pool
) {
  const { rows } = await query(db, 
    `
    INSERT INTO email_verification_tokens (
      id,
      user_id,
      token_hash,
      expires_at
    ) VALUES ($1, $2, $3, $4)
    RETURNING ${ONE_TIME_TOKEN_FIELDS}
    `,
    [id, userId, tokenHash, expiresAt]
  );

  return rows[0];
}

export async function consumeEmailVerificationToken(tokenHash, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE email_verification_tokens
    SET consumed_at = NOW()
    WHERE token_hash = $1
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING ${ONE_TIME_TOKEN_FIELDS}
    `,
    [tokenHash]
  );

  return rows[0] || null;
}

export async function createPasswordResetToken({ id, userId, tokenHash, expiresAt }, db = pool) {
  const { rows } = await query(db, 
    `
    INSERT INTO password_reset_tokens (
      id,
      user_id,
      token_hash,
      expires_at
    ) VALUES ($1, $2, $3, $4)
    RETURNING ${ONE_TIME_TOKEN_FIELDS}
    `,
    [id, userId, tokenHash, expiresAt]
  );

  return rows[0];
}

export async function consumePasswordResetToken(tokenHash, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE password_reset_tokens
    SET consumed_at = NOW()
    WHERE token_hash = $1
      AND consumed_at IS NULL
      AND expires_at > NOW()
    RETURNING ${ONE_TIME_TOKEN_FIELDS}
    `,
    [tokenHash]
  );

  return rows[0] || null;
}
