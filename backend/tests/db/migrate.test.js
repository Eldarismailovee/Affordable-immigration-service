import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import test from "node:test";
import assert from "node:assert/strict";
import { checkMigrationState } from "../../src/db/migrate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "../../src/db/migrations");

async function listMigrationRows() {
  const entries = await fs.readdir(migrationsDir);
  const files = entries.filter((entry) => entry.endsWith(".sql")).sort();

  return Promise.all(
    files.map(async (name) => {
      const sql = await fs.readFile(path.join(migrationsDir, name), "utf8");

      return {
        name,
        checksum: createHash("sha256").update(sql, "utf8").digest("hex"),
      };
    })
  );
}

function dbWithAppliedMigrations(appliedRows, { tableExists = true } = {}) {
  return {
    query: async (text) => {
      if (String(text).includes("to_regclass")) {
        return {
          rows: [{ table_name: tableExists ? "schema_migrations" : null }],
          rowCount: 1,
        };
      }

      if (String(text).includes("FROM schema_migrations")) {
        return { rows: appliedRows, rowCount: appliedRows.length };
      }

      throw new Error(`Unexpected query: ${text}`);
    },
  };
}

test("checkMigrationState reports missing schema_migrations table", async () => {
  const expectedRows = await listMigrationRows();
  const state = await checkMigrationState(
    dbWithAppliedMigrations([], { tableExists: false })
  );

  assert.equal(state.ok, false);
  assert.equal(state.status, "unhealthy");
  assert.equal(state.expected, expectedRows.length);
  assert.equal(state.applied, 0);
  assert.equal(state.pending, expectedRows.length);
  assert.deepEqual(
    state.missing,
    expectedRows.map((row) => row.name)
  );
  assert.equal(state.errorCode, "SCHEMA_MIGRATIONS_TABLE_MISSING");
});

test("checkMigrationState returns ready when all migrations are applied with matching checksums", async () => {
  const appliedRows = await listMigrationRows();
  const state = await checkMigrationState(dbWithAppliedMigrations(appliedRows));

  assert.equal(state.ok, true);
  assert.equal(state.status, "ready");
  assert.equal(state.expected, appliedRows.length);
  assert.equal(state.applied, appliedRows.length);
  assert.equal(state.pending, 0);
  assert.deepEqual(state.missing, []);
  assert.deepEqual(state.checksumMismatches, []);
  assert.deepEqual(state.unknownApplied, []);
});

test("checkMigrationState reports pending migrations", async () => {
  const appliedRows = await listMigrationRows();
  const state = await checkMigrationState(dbWithAppliedMigrations(appliedRows.slice(0, -1)));

  assert.equal(state.ok, false);
  assert.equal(state.status, "unhealthy");
  assert.equal(state.pending, 1);
  assert.deepEqual(state.missing, [appliedRows.at(-1).name]);
  assert.equal(state.errorCode, "SCHEMA_MIGRATIONS_NOT_READY");
});

test("checkMigrationState reports checksum mismatches and unknown applied migrations", async () => {
  const appliedRows = await listMigrationRows();
  const corruptedRows = [
    { ...appliedRows[0], checksum: "changed" },
    ...appliedRows.slice(1),
    { name: "999_removed.sql", checksum: "unknown" },
  ];
  const state = await checkMigrationState(dbWithAppliedMigrations(corruptedRows));

  assert.equal(state.ok, false);
  assert.deepEqual(state.checksumMismatches, [appliedRows[0].name]);
  assert.deepEqual(state.unknownApplied, ["999_removed.sql"]);
  assert.equal(state.errorCode, "SCHEMA_MIGRATIONS_NOT_READY");
});
