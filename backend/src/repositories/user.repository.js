import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { query } from "../db/query.js";

const SAFE_USER_FIELDS =
  "id, email, full_name, role, status, email_verified_at, processing_restricted_at, processing_restriction_reason, created_at, updated_at";
const AUTH_USER_FIELDS = `${SAFE_USER_FIELDS}, password_hash`;

export async function findUserByEmail(email, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT ${AUTH_USER_FIELDS}
    FROM users
    WHERE LOWER(email) = LOWER($1)
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
}

export async function findUserById(userId, db = pool) {
  const { rows } = await query(db, 
    `
    SELECT ${SAFE_USER_FIELDS}
    FROM users
    WHERE id = $1
      AND deleted_at IS NULL
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function countUsers(db = pool) {
  const { rows } = await query(db, 
    "SELECT COUNT(*)::int AS total FROM users WHERE deleted_at IS NULL"
  );
  return rows[0]?.total || 0;
}

export async function countActiveAdmins(db = pool) {
  const { rows } = await query(db, 
    `
    SELECT COUNT(*)::int AS total
    FROM users
    WHERE role = 'admin'
      AND status = 'active'
      AND deleted_at IS NULL
    `
  );

  return rows[0]?.total || 0;
}

export async function createUser({ email, passwordHash, fullName, role }, db = pool) {
  const { rows } = await query(db, 
    `
    INSERT INTO users (
      id,
      email,
      password_hash,
      full_name,
      role,
      status
    ) VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [randomUUID(), email.toLowerCase(), passwordHash, fullName, role]
  );

  return rows[0];
}

export async function listUsers(db = pool) {
  const { rows } = await query(db, 
    `
    SELECT ${SAFE_USER_FIELDS}
    FROM users
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
    `
  );

  return rows;
}

export async function updateUserRoleById(userId, role, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE users
    SET role = $2, updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, role]
  );

  return rows[0] || null;
}

export async function updateUserPasswordById(userId, passwordHash, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE users
    SET
      password_hash = $2,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, passwordHash]
  );

  return rows[0] || null;
}

export async function markUserEmailVerifiedById(userId, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE users
    SET
      email_verified_at = COALESCE(email_verified_at, NOW()),
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function softDeleteUserById(userId, db = pool) {
  const { rows } = await query(db, 
    `
    UPDATE users
    SET
      status = 'disabled',
      deleted_at = COALESCE(deleted_at, NOW()),
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function updateUserFullNameById(userId, fullName, db = pool) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET full_name = $2, updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, fullName]
  );

  return rows[0] || null;
}

export async function setUserProcessingRestriction(
  { userId, reason, restricted },
  db = pool
) {
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      processing_restricted_at = CASE WHEN $2 THEN COALESCE(processing_restricted_at, NOW()) ELSE NULL END,
      processing_restriction_reason = CASE WHEN $2 THEN $3 ELSE NULL END,
      updated_at = NOW()
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, restricted, reason ?? null]
  );

  return rows[0] || null;
}

export async function anonymizeUserById(userId, db = pool) {
  const email = `anonymized+${userId}@deleted.local`;
  const { rows } = await query(
    db,
    `
    UPDATE users
    SET
      email = $2,
      full_name = 'Deleted User',
      password_hash = '',
      status = 'disabled',
      deleted_at = COALESCE(deleted_at, NOW()),
      processing_restricted_at = COALESCE(processing_restricted_at, NOW()),
      processing_restriction_reason = COALESCE(
        processing_restriction_reason,
        'Account anonymized per DSAR request'
      ),
      updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, full_name, role, status, deleted_at, created_at, updated_at
    `,
    [userId, email]
  );

  return rows[0] || null;
}

export async function findUserByIdIncludingDeleted(userId, db = pool) {
  const { rows } = await query(
    db,
    `
    SELECT ${SAFE_USER_FIELDS}, deleted_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}
