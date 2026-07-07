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
  mfa_completed_at,
  session_security_version,
  created_at
`;

const EMAIL_VERIFICATION_TOKEN_FIELDS = `
  id,
  user_id,
  email,
  token_hash,
  purpose,
  consumed_at,
  invalidated_at,
  expires_at,
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
  {
    id,
    userId,
    tokenHash,
    expiresAt,
    userAgent = "",
    ipAddress = "",
    mfaCompletedAt = null,
    sessionSecurityVersion = 1,
  },
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
      ip_address,
      mfa_completed_at,
      session_security_version
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING ${REFRESH_TOKEN_FIELDS}
    `,
    [
      id,
      userId,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
      mfaCompletedAt,
      sessionSecurityVersion,
    ]
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

export class RefreshTokenRotationError extends Error {
  constructor() {
    super("Refresh token rotation failed");
    this.name = "RefreshTokenRotationError";
  }
}

export async function rotateRefreshToken(
  {
    currentTokenId,
    nextTokenId,
    userId,
    tokenHash,
    expiresAt,
    userAgent,
    ipAddress,
    mfaCompletedAt = null,
    sessionSecurityVersion = 1,
  },
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
        mfaCompletedAt,
        sessionSecurityVersion,
      },
      client
    );

    const result = await query(
      client,
      `
      UPDATE auth_refresh_tokens
      SET
        revoked_at = NOW(),
        replaced_by_token_id = $2,
        last_used_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL
      `,
      [currentTokenId, nextTokenId]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new RefreshTokenRotationError();
    }

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
  { id, userId, email, tokenHash, purpose, expiresAt },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    INSERT INTO email_verification_tokens (
      id,
      user_id,
      email,
      token_hash,
      purpose,
      expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING ${EMAIL_VERIFICATION_TOKEN_FIELDS}
    `,
    [id, userId, email, tokenHash, purpose, expiresAt]
  );

  return rows[0];
}

export async function invalidateEmailVerificationTokensForUser(
  userId,
  { purpose = null } = {},
  db = pool
) {
  const params = [userId];
  let purposeClause = "";

  if (purpose) {
    params.push(purpose);
    purposeClause = "AND purpose = $2";
  }

  await query(
    db,
    `
    UPDATE email_verification_tokens
    SET invalidated_at = COALESCE(invalidated_at, NOW())
    WHERE user_id = $1
      AND consumed_at IS NULL
      AND invalidated_at IS NULL
      ${purposeClause}
    `,
    params
  );
}

export async function countRecentEmailVerificationSends(
  userId,
  since,
  db = pool
) {
  const { rows } = await query(
    db,
    `
    SELECT COUNT(*)::int AS total
    FROM email_verification_tokens
    WHERE user_id = $1
      AND created_at >= $2
    `,
    [userId, since]
  );

  return rows[0]?.total ?? 0;
}

export async function findActiveEmailVerificationTokenByHash(tokenHash, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${EMAIL_VERIFICATION_TOKEN_FIELDS}
    FROM email_verification_tokens
    WHERE token_hash = $1
      AND consumed_at IS NULL
      AND invalidated_at IS NULL
      AND expires_at > NOW()
    LIMIT 1
    `,
    [tokenHash]
  );

  return rows[0] || null;
}

export async function consumeEmailVerificationToken(
  tokenHash,
  { purpose = null, email = null } = {},
  db = pool
) {
  const params = [tokenHash];
  let extraClauses = "";

  if (purpose) {
    params.push(purpose);
    extraClauses += ` AND purpose = $${params.length}`;
  }

  if (email) {
    params.push(email);
    extraClauses += ` AND LOWER(email) = LOWER($${params.length})`;
  }

  const { rows } = await query(
    db,
    `
    UPDATE email_verification_tokens
    SET consumed_at = NOW()
    WHERE token_hash = $1
      AND consumed_at IS NULL
      AND invalidated_at IS NULL
      AND expires_at > NOW()
      ${extraClauses}
    RETURNING ${EMAIL_VERIFICATION_TOKEN_FIELDS}
    `,
    params
  );

  return rows[0] || null;
}

export async function incrementEmailVerificationFailedAttempts(tokenHash, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE email_verification_tokens
    SET invalidated_at = NOW()
    WHERE token_hash = $1
      AND consumed_at IS NULL
      AND invalidated_at IS NULL
    RETURNING id
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
