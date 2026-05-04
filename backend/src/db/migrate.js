import fs from "fs/promises";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import pool from "./pool.js";
import { logger } from "../lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");
const MIGRATION_LOCK_KEY = "app:schema_migrations";

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      checksum TEXT,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      execution_ms INTEGER
    )
  `);

  await client.query(`
    ALTER TABLE schema_migrations
    ADD COLUMN IF NOT EXISTS checksum TEXT
  `);

  await client.query(`
    ALTER TABLE schema_migrations
    ADD COLUMN IF NOT EXISTS execution_ms INTEGER
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    `
    SELECT name, checksum, execution_ms
    FROM schema_migrations
    `
  );

  return new Map(rows.map((row) => [row.name, row]));
}

function toChecksum(sql) {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

async function listMigrations() {
  const entries = await fs.readdir(migrationsDir);
  const files = entries.filter((entry) => entry.endsWith(".sql")).sort();

  const migrations = await Promise.all(
    files.map(async (name) => {
      const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");
      return {
        name,
        sql,
        checksum: toChecksum(sql),
      };
    })
  );

  return migrations;
}

async function acquireMigrationLock(client) {
  await client.query("SELECT pg_advisory_lock(hashtext($1))", [MIGRATION_LOCK_KEY]);
}

async function releaseMigrationLock(client) {
  const { rows } = await client.query(
    "SELECT pg_advisory_unlock(hashtext($1)) AS unlocked",
    [MIGRATION_LOCK_KEY]
  );

  if (!rows[0]?.unlocked) {
    throw new Error("Failed to release schema migration advisory lock");
  }
}

async function backfillLegacyMigrationMetadata(client, appliedByName, migrationsByName) {
  for (const appliedMigration of appliedByName.values()) {
    const needsBackfill =
      typeof appliedMigration.checksum !== "string" ||
      appliedMigration.checksum.length === 0 ||
      appliedMigration.execution_ms === null;

    if (!needsBackfill) {
      continue;
    }

    const migration = migrationsByName.get(appliedMigration.name);

    if (!migration) {
      throw new Error(
        `Applied migration "${appliedMigration.name}" is missing on disk; cannot backfill checksum metadata`
      );
    }

    await client.query(
      `
      UPDATE schema_migrations
      SET
        checksum = COALESCE(checksum, $2),
        execution_ms = COALESCE(execution_ms, 0)
      WHERE name = $1
      `,
      [appliedMigration.name, migration.checksum]
    );
  }
}

async function enforceMigrationMetadataConstraints(client) {
  await client.query(`
    ALTER TABLE schema_migrations
    ALTER COLUMN checksum SET NOT NULL
  `);

  await client.query(`
    ALTER TABLE schema_migrations
    ALTER COLUMN execution_ms SET NOT NULL
  `);
}

function assertMigrationChecksumsMatch(appliedByName, migrations) {
  for (const migration of migrations) {
    const applied = appliedByName.get(migration.name);

    if (!applied) {
      continue;
    }

    if (applied.checksum !== migration.checksum) {
      throw new Error(
        `Checksum mismatch for applied migration "${migration.name}". File contents changed after apply.`
      );
    }
  }
}

export async function runMigrations() {
  const client = await pool.connect();
  let lockAcquired = false;
  let migrationError = null;
  let unlockError = null;

  try {
    await acquireMigrationLock(client);
    lockAcquired = true;

    await ensureMigrationsTable(client);
    const migrations = await listMigrations();
    const migrationsByName = new Map(migrations.map((migration) => [migration.name, migration]));

    let appliedByName = await getAppliedMigrations(client);
    await backfillLegacyMigrationMetadata(client, appliedByName, migrationsByName);
    await enforceMigrationMetadataConstraints(client);
    appliedByName = await getAppliedMigrations(client);

    assertMigrationChecksumsMatch(appliedByName, migrations);

    for (const migration of migrations) {
      if (appliedByName.has(migration.name)) {
        continue;
      }

      const startedAt = process.hrtime.bigint();
      await client.query("BEGIN");

      try {
        await client.query(migration.sql);
        const executionMs = Math.max(
          0,
          Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000)
        );
        await client.query(
          `
          INSERT INTO schema_migrations (name, checksum, execution_ms)
          VALUES ($1, $2, $3)
          `,
          [migration.name, migration.checksum, executionMs]
        );
        await client.query("COMMIT");

        logger.info(
          {
            migration: migration.name,
            checksum: migration.checksum,
            executionMs,
          },
          "Applied database migration"
        );
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } catch (error) {
    migrationError = error;
    throw error;
  } finally {
    if (lockAcquired) {
      try {
        await releaseMigrationLock(client);
      } catch (error) {
        if (migrationError) {
          logger.error({ err: error }, "Failed to release schema migration lock");
        } else {
          unlockError = error;
        }
      }
    }

    client.release();

    if (unlockError) {
      throw unlockError;
    }
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isCli) {
  runMigrations()
    .then(async () => {
      await pool.end();
    })
    .catch(async (error) => {
      logger.error({ err: error }, "Database migration failed");
      await pool.end();
      process.exitCode = 1;
    });
}
