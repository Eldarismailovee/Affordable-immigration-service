import { randomUUID } from "crypto";
import pool from "./pool.js";
import env from "../config/env.js";
import { hashPassword } from "../utils/auth.js";

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
  `);

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return;
  }

  const existingAdmin = await pool.query(
    `
    SELECT id
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [env.ADMIN_EMAIL.toLowerCase()]
  );

  if (existingAdmin.rows.length > 0) {
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  await pool.query(
    `
    INSERT INTO users (
      id,
      email,
      password_hash,
      full_name,
      role,
      status
    ) VALUES ($1, $2, $3, $4, 'admin', 'active')
    `,
    [
      randomUUID(),
      env.ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      env.ADMIN_NAME || "System Administrator",
    ]
  );
}
