import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  checkDatabaseHealth,
  checkDatabaseReadiness,
} from "../../src/db/health.js";

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

test("checkDatabaseHealth returns ready when SELECT 1 succeeds", async () => {
  const db = {
    query: async (text, params) => {
      assert.equal(text, "SELECT 1 AS ok");
      assert.deepEqual(params, []);
      return { rows: [{ ok: 1 }], rowCount: 1 };
    },
  };

  const result = await checkDatabaseHealth(db);

  assert.equal(result.ok, true);
  assert.equal(result.status, "ready");
  assert.equal(typeof result.latencyMs, "number");
});

test("checkDatabaseHealth returns unhealthy without leaking error messages", async () => {
  const error = new Error("connection string contains sensitive host");
  error.code = "ECONNREFUSED";
  const db = {
    query: async () => {
      throw error;
    },
  };

  const result = await checkDatabaseHealth(db);

  assert.equal(result.ok, false);
  assert.equal(result.status, "unhealthy");
  assert.equal(result.errorCode, "ECONNREFUSED");
  assert.equal("error" in result, false);
});

test("checkDatabaseReadiness returns ready when DB and migrations are ready", async () => {
  const appliedRows = await listMigrationRows();
  const db = {
    query: async (text) => {
      const sql = String(text);

      if (sql.includes("SELECT 1 AS ok")) {
        return { rows: [{ ok: 1 }], rowCount: 1 };
      }

      if (sql.includes("to_regclass")) {
        return { rows: [{ table_name: "schema_migrations" }], rowCount: 1 };
      }

      if (sql.includes("FROM schema_migrations")) {
        return { rows: appliedRows, rowCount: appliedRows.length };
      }

      throw new Error(`Unexpected query: ${text}`);
    },
  };

  const result = await checkDatabaseReadiness(db);

  assert.equal(result.ok, true);
  assert.equal(result.database.ok, true);
  assert.equal(result.migrations.ok, true);
});

test("checkDatabaseReadiness returns not ready when migrations are pending", async () => {
  const appliedRows = await listMigrationRows();
  const db = {
    query: async (text) => {
      const sql = String(text);

      if (sql.includes("SELECT 1 AS ok")) {
        return { rows: [{ ok: 1 }], rowCount: 1 };
      }

      if (sql.includes("to_regclass")) {
        return { rows: [{ table_name: "schema_migrations" }], rowCount: 1 };
      }

      if (sql.includes("FROM schema_migrations")) {
        return { rows: appliedRows.slice(0, -1), rowCount: appliedRows.length - 1 };
      }

      throw new Error(`Unexpected query: ${text}`);
    },
  };

  const result = await checkDatabaseReadiness(db);

  assert.equal(result.ok, false);
  assert.equal(result.database.ok, true);
  assert.equal(result.migrations.ok, false);
  assert.equal(result.migrations.pending, 1);
});

test("checkDatabaseReadiness skips migration check when DB is unavailable", async () => {
  const db = {
    query: async () => {
      const error = new Error("connection refused");
      error.code = "ECONNREFUSED";
      throw error;
    },
  };

  const result = await checkDatabaseReadiness(db);

  assert.equal(result.ok, false);
  assert.equal(result.database.ok, false);
  assert.equal(result.migrations.status, "skipped");
  assert.equal(result.migrations.errorCode, "DATABASE_UNAVAILABLE");
});
