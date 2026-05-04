import { logger } from "../lib/logger.js";

function getStatementType(sql) {
  if (typeof sql !== "string") {
    return "UNKNOWN";
  }

  const statement = sql.trim().split(/\s+/, 1)[0];
  return statement ? statement.toUpperCase() : "UNKNOWN";
}

function getTarget(sql) {
  if (typeof sql !== "string") {
    return "unknown";
  }

  const match = sql.match(/\b(?:FROM|INTO|UPDATE|JOIN)\s+("?[\w.]+"?)/i);
  return match?.[1] || "unknown";
}

function toDurationMs(startTimeNs) {
  const elapsedNs = process.hrtime.bigint() - startTimeNs;
  return Number(elapsedNs) / 1_000_000;
}

export async function query(db, text, params = [], options = {}) {
  if (!db || typeof db.query !== "function") {
    throw new TypeError("Database executor must provide a query(text, params) method");
  }

  const startTimeNs = process.hrtime.bigint();
  const statementType = getStatementType(text);
  const target = getTarget(text);
  const queryName = options.name || "unnamed";
  const paramCount = Array.isArray(params) ? params.length : 0;

  try {
    const result = await db.query(text, params);

    logger.trace(
      {
        queryName,
        statementType,
        target,
        durationMs: toDurationMs(startTimeNs),
        rowCount: result?.rowCount ?? null,
        paramCount,
      },
      "Database query completed"
    );

    return result;
  } catch (error) {
    logger.error(
      {
        err: error,
        queryName,
        statementType,
        target,
        durationMs: toDurationMs(startTimeNs),
        paramCount,
      },
      "Database query failed"
    );

    throw error;
  }
}
