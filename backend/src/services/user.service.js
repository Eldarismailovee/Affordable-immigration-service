import pool from "../db/pool.js";
import { sanitizeUser } from "../utils/auth.js";

export async function getUserById(userId) {
  const { rows } = await pool.query(
    `
    SELECT id, email, full_name, role, status, created_at, updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function listUsers() {
  const { rows } = await pool.query(
    `
    SELECT id, email, full_name, role, status, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
    `
  );

  return rows.map(sanitizeUser);
}

export async function updateUserRole(userId, role) {
  if (!["admin", "user"].includes(role)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  const currentResult = await pool.query(
    `
    SELECT id, role
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  if (currentResult.rows.length === 0) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (currentResult.rows[0].role === "admin" && role !== "admin") {
    const adminCountResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE role = 'admin' AND status = 'active'"
    );

    if (adminCountResult.rows[0]?.total <= 1) {
      const error = new Error("At least one active administrator is required");
      error.statusCode = 400;
      throw error;
    }
  }

  const { rows } = await pool.query(
    `
    UPDATE users
    SET role = $2, updated_at = NOW()
    WHERE id = $1
    RETURNING id, email, full_name, role, status, created_at, updated_at
    `,
    [userId, role]
  );

  return sanitizeUser(rows[0]);
}
