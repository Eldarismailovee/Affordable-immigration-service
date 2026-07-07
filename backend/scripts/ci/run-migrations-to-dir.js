/**
 * Apply migrations from a specific directory (used for upgrade-path testing).
 * Usage: node scripts/ci/run-migrations-to-dir.js <migrations-dir>
 */
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../../src/db/pool.js";

const migrationsDir = path.resolve(process.argv[2]);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function ensureTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      execution_ms INTEGER
    )
  `);
}

async function main() {
  const client = await pool.connect();
  try {
    await ensureTable(client);
    const files = (await fs.readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort();
    for (const name of files) {
      const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
      const { rows } = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [name]
      );
      if (rows.length > 0) continue;
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (name, checksum, execution_ms) VALUES ($1, $2, $3)",
          [name, "upgrade-test", 0]
        );
        await client.query("COMMIT");
        console.log(`Applied ${name}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
