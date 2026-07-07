import pool from "../db/pool.js";
import { query } from "../db/query.js";
import { withTransaction } from "../db/transaction.js";

const FACTOR_FIELDS = `
  id,
  user_id,
  type,
  encrypted_secret,
  encryption_nonce,
  key_version,
  status,
  enrolled_at,
  verified_at,
  disabled_at,
  last_used_timestep,
  created_at,
  updated_at
`;

export async function findActiveTotpFactorByUserId(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${FACTOR_FIELDS}
    FROM user_mfa_factors
    WHERE user_id = $1
      AND type = 'totp'
      AND status = 'active'
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function findPendingTotpFactorByUserId(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${FACTOR_FIELDS}
    FROM user_mfa_factors
    WHERE user_id = $1
      AND type = 'totp'
      AND status = 'pending'
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function invalidatePendingTotpFactors(userId, db = pool) {
  await query(
    db,
    `
    UPDATE user_mfa_factors
    SET
      status = 'disabled',
      disabled_at = COALESCE(disabled_at, NOW()),
      updated_at = NOW()
    WHERE user_id = $1
      AND type = 'totp'
      AND status = 'pending'
    `,
    [userId]
  );
}

export async function createPendingTotpFactor(
  { id, userId, encryptedSecret, encryptionNonce, keyVersion },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    INSERT INTO user_mfa_factors (
      id,
      user_id,
      type,
      encrypted_secret,
      encryption_nonce,
      key_version,
      status
    ) VALUES ($1, $2, 'totp', $3, $4, $5, 'pending')
    RETURNING ${FACTOR_FIELDS}
    `,
    [id, userId, encryptedSecret, encryptionNonce, keyVersion]
  );

  return rows[0];
}

export async function activateTotpFactor(
  { factorId, userId, timestep },
  db = pool
) {
  await query(
    db,
    `
    UPDATE user_mfa_factors
    SET
      status = 'disabled',
      disabled_at = COALESCE(disabled_at, NOW()),
      updated_at = NOW()
    WHERE user_id = $1
      AND type = 'totp'
      AND status = 'active'
      AND id <> $2
    `,
    [userId, factorId]
  );

  const { rows } = await query(
    db,
    `
    UPDATE user_mfa_factors
    SET
      status = 'active',
      enrolled_at = NOW(),
      verified_at = NOW(),
      last_used_timestep = $3,
      updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND status = 'pending'
    RETURNING ${FACTOR_FIELDS}
    `,
    [factorId, userId, timestep]
  );

  return rows[0] || null;
}

export async function disableActiveTotpFactor(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE user_mfa_factors
    SET
      status = 'disabled',
      disabled_at = COALESCE(disabled_at, NOW()),
      updated_at = NOW()
    WHERE user_id = $1
      AND type = 'totp'
      AND status = 'active'
    RETURNING ${FACTOR_FIELDS}
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function resetUserMfaFactors(userId, db = pool) {
  await query(
    db,
    `
    UPDATE user_mfa_factors
    SET
      status = 'disabled',
      disabled_at = COALESCE(disabled_at, NOW()),
      updated_at = NOW()
    WHERE user_id = $1
      AND status IN ('active', 'pending')
    `,
    [userId]
  );
}

export async function consumeTotpTimestep(
  { factorId, userId, timestep, previousTimestep },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE user_mfa_factors
    SET
      last_used_timestep = $4,
      updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
      AND status = 'active'
      AND (last_used_timestep IS NULL OR last_used_timestep < $4)
      AND ($5::bigint IS NULL OR last_used_timestep = $5)
    RETURNING ${FACTOR_FIELDS}
    `,
    [factorId, userId, timestep, timestep, previousTimestep ?? null]
  );

  return rows[0] || null;
}

export async function insertRecoveryCodes({ userId, codes }, db = pool) {
  for (const { id, codeHash } of codes) {
    await query(
      db,
      `
      INSERT INTO user_mfa_recovery_codes (id, user_id, code_hash)
      VALUES ($1, $2, $3)
      `,
      [id, userId, codeHash]
    );
  }
}

export async function deleteRecoveryCodesByUserId(userId, db = pool) {
  await query(
    db,
    `DELETE FROM user_mfa_recovery_codes WHERE user_id = $1`,
    [userId]
  );
}

export async function consumeRecoveryCode({ userId, codeHash }, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE user_mfa_recovery_codes
    SET used_at = NOW()
    WHERE user_id = $1
      AND code_hash = $2
      AND used_at IS NULL
    RETURNING id, user_id, code_hash, used_at, created_at
    `,
    [userId, codeHash]
  );

  return rows[0] || null;
}

export async function listUnusedRecoveryCodeHashes(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT code_hash
    FROM user_mfa_recovery_codes
    WHERE user_id = $1
      AND used_at IS NULL
    `,
    [userId]
  );

  return rows.map((row) => row.code_hash);
}

export async function verifyAndConsumeRecoveryCode(userId, normalizedCode, db = pool) {
  const hashes = await listUnusedRecoveryCodeHashes(userId, db);

  for (const codeHash of hashes) {
    if (await verifyRecoveryCodeHash(normalizedCode, codeHash)) {
      const consumed = await consumeRecoveryCode({ userId, codeHash }, db);

      if (consumed) {
        return true;
      }
    }
  }

  return false;
}

async function verifyRecoveryCodeHash(code, storedHash) {
  const [algorithm, salt, storedKey] = String(storedHash || "").split(":");

  if (algorithm !== "scrypt" || !salt || !storedKey) {
    return false;
  }

  const scryptAsync = (await import("node:util")).promisify(
    (await import("node:crypto")).scrypt
  );
  const key = await scryptAsync(code, salt, 32);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (storedBuffer.length !== key.length) {
    return false;
  }

  return (await import("node:crypto")).timingSafeEqual(storedBuffer, key);
}

export async function countUnusedRecoveryCodes(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT COUNT(*)::int AS total
    FROM user_mfa_recovery_codes
    WHERE user_id = $1
      AND used_at IS NULL
    `,
    [userId]
  );

  return rows[0]?.total || 0;
}

export async function hasActiveMfa(userId, db = pool) {
  const factor = await findActiveTotpFactorByUserId(userId, db);
  return Boolean(factor);
}

export async function activateEnrollmentTransaction(
  {
    factorId,
    userId,
    timestep,
    recoveryCodes,
  },
  db = pool
) {
  return withTransaction(async (client) => {
    const factor = await activateTotpFactor({ factorId, userId, timestep }, client);

    if (!factor) {
      return null;
    }

    await deleteRecoveryCodesByUserId(userId, client);
    await insertRecoveryCodes({ userId, codes: recoveryCodes }, client);

    return factor;
  }, db);
}
