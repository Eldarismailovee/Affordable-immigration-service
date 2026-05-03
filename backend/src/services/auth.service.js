import { randomUUID } from "crypto";
import pool from "../db/pool.js";
import { createAuthToken, hashPassword, sanitizeUser, verifyPassword } from "../utils/auth.js";

async function getUserByEmail(email) {
  const { rows } = await pool.query(
    `
    SELECT id, email, password_hash, full_name, role, status, created_at, updated_at
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email.toLowerCase()]
  );

  return rows[0] || null;
}

async function getInitialRole() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS total FROM users");
  return rows[0]?.total === 0 ? "admin" : "user";
}

export async function registerUser(payload) {
  const email = payload.email.toLowerCase();
  const existing = await getUserByEmail(email);

  if (existing) {
    const error = new Error("A user with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const role = await getInitialRole();
  const passwordHash = await hashPassword(payload.password);

  const { rows } = await pool.query(
    `
    INSERT INTO users (
      id,
      email,
      password_hash,
      full_name,
      role,
      status
    ) VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING id, email, full_name, role, status, created_at, updated_at
    `,
    [randomUUID(), email, passwordHash, payload.fullName, role]
  );

  const user = sanitizeUser(rows[0]);

  return {
    user,
    token: createAuthToken(user),
  };
}

export async function loginUser(payload) {
  const user = await getUserByEmail(payload.email);

  if (!user || user.status !== "active") {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordOk = await verifyPassword(payload.password, user.password_hash);

  if (!passwordOk) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const safeUser = sanitizeUser(user);

  return {
    user: safeUser,
    token: createAuthToken(safeUser),
  };
}
