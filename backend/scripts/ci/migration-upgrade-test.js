/**
 * Migration upgrade scenarios for CI.
 * Requires DATABASE_URL pointing at an empty or resettable test database.
 */
import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import pool from "../../src/db/pool.js";
import { runMigrations, checkMigrationState } from "../../src/db/migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "../../src/db/migrations");

function toChecksum(sql) {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

async function resetSchema() {
  const client = await pool.connect();
  try {
    await client.query("DROP SCHEMA public CASCADE");
    await client.query("CREATE SCHEMA public");
    await client.query("GRANT ALL ON SCHEMA public TO public");
  } finally {
    client.release();
  }
}

async function applyThrough(lastFileName) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        checksum TEXT,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        execution_ms INTEGER NOT NULL DEFAULT 0
      )
    `);
    const files = (await fs.readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const name of files) {
      const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
      const checksum = toChecksum(sql);
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name, checksum, execution_ms) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING",
          [name, checksum]
        );
        await client.query("COMMIT");
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
      if (name === lastFileName) break;
    }
  } finally {
    client.release();
  }
}

async function assertReady(label) {
  const state = await checkMigrationState();
  if (!state.ok) {
    console.error(`${label}: migration state not ready`, state);
    process.exit(1);
  }
  console.log(`${label}: ok (${state.applied}/${state.expected} migrations)`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  console.log("=== Clean apply 001-018 ===");
  await resetSchema();
  await runMigrations();
  await assertReady("clean apply");

  console.log("=== Upgrade path 001-017 → 018 ===");
  await resetSchema();
  await applyThrough("017_privileged_mfa.sql");
  await runMigrations();
  await assertReady("upgrade to 018");

  console.log("=== Idempotent re-run ===");
  await runMigrations();
  await assertReady("idempotent");

  console.log("Migration upgrade scenarios passed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
