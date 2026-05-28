import pool from "./pool.js";
import { query } from "./query.js";
import { checkMigrationState } from "./migrate.js";

function toDurationMs(startTimeNs) {
  const elapsedNs = process.hrtime.bigint() - startTimeNs;
  return Number(elapsedNs) / 1_000_000;
}

export async function checkDatabaseHealth(db = pool) {
  const startTimeNs = process.hrtime.bigint();

  try {
    const { rows } = await query(db, "SELECT 1 AS ok", [], {
      name: "db.health",
    });
    const ok = rows[0]?.ok === 1;

    return {
      ok,
      status: ok ? "ready" : "unhealthy",
      latencyMs: toDurationMs(startTimeNs),
    };
  } catch (error) {
    return {
      ok: false,
      status: "unhealthy",
      latencyMs: toDurationMs(startTimeNs),
      errorCode: error.code || "DATABASE_HEALTH_CHECK_FAILED",
    };
  }
}

export async function checkDatabaseReadiness(db = pool) {
  const database = await checkDatabaseHealth(db);

  if (!database.ok) {
    return {
      ok: false,
      database,
      migrations: {
        ok: false,
        status: "skipped",
        errorCode: "DATABASE_UNAVAILABLE",
      },
    };
  }

  try {
    const migrations = await checkMigrationState(db);

    return {
      ok: database.ok && migrations.ok,
      database,
      migrations,
    };
  } catch (error) {
    return {
      ok: false,
      database,
      migrations: {
        ok: false,
        status: "unhealthy",
        errorCode: error.code || "MIGRATION_STATE_CHECK_FAILED",
      },
    };
  }
}
