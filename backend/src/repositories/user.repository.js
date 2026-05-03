import { randomUUID } from "crypto";
import pool from "../db/pool.js";

const SAFE_USER_FIELDS = "id, email, full_name, role, status, created_at, updated_at";
const AUTH_USER_FIELDS = `${SAFE_USER_FIELDS}, password_hash`;

export async function findUserByEmail(email, db = pool) {
  const { rows } = await db.query(
    `
    SELECT ${AUTH_USER_FIELDS}
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email.toLowerCase()]
  );

  return rows[0] || null;
}

export async function findUserById(userId, db = pool) {
  const { rows } = await db.query(
    `
    SELECT ${SAFE_USER_FIELDS}
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function countUsers(db = pool) {
  const { rows } = await db.query("SELECT COUNT(*)::int AS total FROM users");
  return rows[0]?.total || 0;
}

export async function countActiveAdmins(db = pool) {
  const { rows } = await db.query(
    "SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin' AND status = 'active'"
  );

  return rows[0]?.total || 0;
}

export async function createUser({ email, passwordHash, fullName, role }, db = pool) {
  const { rows } = await db.query(
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
  const { rows } = await db.query(
    `
    SELECT ${SAFE_USER_FIELDS}
    FROM users
    ORDER BY created_at DESC
    `
  );

  return rows;
}

export async function updateUserRoleById(userId, role, db = pool) {
  const { rows } = await db.query(
    `
    UPDATE users
    SET role = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING ${SAFE_USER_FIELDS}
    `,
    [userId, role]
  );

  return rows[0] || null;
}
