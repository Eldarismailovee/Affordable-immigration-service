import { withTransaction } from "../db/transaction.js";
import { AppError, isAppError } from "../utils/appError.js";
import {
  IDEMPOTENCY_ERROR_CODES,
  IDEMPOTENCY_STATES,
} from "../constants/idempotency.js";
import { idempotencyConfig, shortKeyFingerprint } from "../config/idempotency.js";
import { computeRequestHash } from "../utils/canonicalRequestHash.js";
import {
  completeIdempotencyRecord,
  deleteExpiredIdempotencyRecords,
  findIdempotencyRecordForUpdate,
  insertIdempotencyProcessing,
  markIdempotencyFailedRetryable,
  markIdempotencyFailedTerminal,
  reclaimStaleProcessingRecord,
  reacquireIdempotencyRecord,
} from "../repositories/idempotency.repository.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { logger } from "../lib/logger.js";

const conflictAuditLastLogged = new Map();
const CONFLICT_AUDIT_WINDOW_MS = 60_000;

function logIdempotencyEvent(event, fields = {}) {
  logger.info(
    {
      idempotencyEvent: event,
      ...fields,
    },
    `idempotency.${event}`
  );
}

function shouldLogConflict(actorScope, operation, fingerprint) {
  const key = `${actorScope}:${operation}:${fingerprint}`;
  const now = Date.now();
  const last = conflictAuditLastLogged.get(key);

  if (last && now - last < CONFLICT_AUDIT_WINDOW_MS) {
    return false;
  }

  conflictAuditLastLogged.set(key, now);
  return true;
}

function computeExpiresAt(ttlSeconds = idempotencyConfig.defaultTtlSeconds) {
  return new Date(Date.now() + ttlSeconds * 1000);
}

function isStaleProcessing(record) {
  if (record.state !== IDEMPOTENCY_STATES.PROCESSING) {
    return false;
  }

  const lockedAt = record.lockedAt ? new Date(record.lockedAt).getTime() : 0;
  const timeoutMs = idempotencyConfig.processingTimeoutSeconds * 1000;

  return Date.now() - lockedAt > timeoutMs;
}

function sanitizeResponseBody(body) {
  const serialized = JSON.stringify(body ?? null);

  if (Buffer.byteLength(serialized, "utf8") > idempotencyConfig.maxResponseBytes) {
    throw new AppError(
      "Response exceeds idempotency storage limit.",
      500,
      "IDEMPOTENCY_RESPONSE_TOO_LARGE"
    );
  }

  return body ?? null;
}

function stripForbiddenReplayFields(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }

  const clone = { ...body };
  delete clone.token;
  delete clone.accessToken;
  delete clone.refreshToken;
  delete clone.mfaChallengeToken;
  delete clone.verificationToken;
  delete clone.recoveryCodes;
  delete clone.secret;
  delete clone.otpauthUrl;

  return clone;
}

export function buildActorScope({ user, anonymousScope = "anonymous:public" }) {
  if (user?.id) {
    const prefix = user.role === "admin" || user.role === "attorney" ? "admin" : "user";
    return `${prefix}:${user.id}`;
  }

  return anonymousScope;
}

export function buildRequestHashInput({
  operation,
  actorScope,
  body,
  pathParams,
  queryParams,
}) {
  return computeRequestHash({
    operation,
    actorScope,
    body,
    pathParams,
    queryParams,
  });
}

async function auditIdempotencyConflict({
  operation,
  actorScope,
  fingerprint,
  auditContext,
  actor,
}) {
  if (!shouldLogConflict(actorScope, operation, fingerprint)) {
    return;
  }

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.IDEMPOTENCY_KEY_CONFLICT,
    category: AUDIT_CATEGORIES.SECURITY,
    action: "idempotency_conflict",
    result: AUDIT_RESULTS.FAILURE,
    actorUserId: actor?.id ?? null,
    actorRole: actor?.role ?? null,
    targetType: "idempotency",
    targetId: null,
    request: auditContext,
    metadata: {
      operation,
      actorScope,
      keyFingerprint: fingerprint,
    },
  }).catch(() => {});
}

async function resolveExistingRecord({
  record,
  requestHash,
  operation,
  actorScope,
  keyFingerprint,
  authorizeReplay,
  auditContext,
  actor,
}) {
  if (record.requestHash !== requestHash) {
    logIdempotencyEvent("conflict", {
      operation,
      actorScope,
      keyFingerprint,
      recordId: record.id,
    });

    await auditIdempotencyConflict({
      operation,
      actorScope,
      fingerprint: keyFingerprint,
      auditContext,
      actor,
    });

    throw new AppError(
      "This idempotency key was already used with a different request.",
      409,
      IDEMPOTENCY_ERROR_CODES.KEY_CONFLICT
    );
  }

  if (record.state === IDEMPOTENCY_STATES.PROCESSING) {
    if (isStaleProcessing(record)) {
      logIdempotencyEvent("stale", {
        operation,
        actorScope,
        keyFingerprint,
        recordId: record.id,
      });

      await reclaimStaleProcessingRecord({ id: record.id });

      return { kind: "retry_after_stale" };
    }

    logIdempotencyEvent("in_progress", {
      operation,
      actorScope,
      keyFingerprint,
      recordId: record.id,
    });

    throw new AppError(
      "An identical request is already in progress.",
      409,
      IDEMPOTENCY_ERROR_CODES.REQUEST_IN_PROGRESS
    );
  }

  if (
    record.state === IDEMPOTENCY_STATES.COMPLETED ||
    record.state === IDEMPOTENCY_STATES.FAILED_TERMINAL
  ) {
    if (authorizeReplay) {
      await authorizeReplay();
    }

    logIdempotencyEvent("replayed", {
      operation,
      actorScope,
      keyFingerprint,
      recordId: record.id,
      replayed: true,
    });

    return {
      kind: "replay",
      httpStatus: record.httpStatus,
      responseBody: record.responseBody,
    };
  }

  if (record.state === IDEMPOTENCY_STATES.FAILED_RETRYABLE) {
    return { kind: "retry_after_failed" };
  }

  throw new AppError(
    "An identical request is already in progress.",
    409,
    IDEMPOTENCY_ERROR_CODES.REQUEST_IN_PROGRESS
  );
}

export async function runIdempotentCommand({
  operation,
  actorScope,
  idempotencyKeyHash,
  keyFingerprint,
  requestHash,
  ttlSeconds = idempotencyConfig.defaultTtlSeconds,
  authorizeReplay,
  auditContext = null,
  actor = null,
  execute,
}) {
  return withTransaction(async (client) => {
    const expiresAt = computeExpiresAt(ttlSeconds);

    let inserted = await insertIdempotencyProcessing(
      {
        actorScope,
        operation,
        idempotencyKeyHash,
        requestHash,
        expiresAt,
      },
      client
    );

    if (!inserted) {
      const existing = await findIdempotencyRecordForUpdate(
        { actorScope, operation, idempotencyKeyHash },
        client
      );

      const resolution = await resolveExistingRecord({
        record: existing,
        requestHash,
        operation,
        actorScope,
        keyFingerprint,
        authorizeReplay,
        auditContext,
        actor,
      });

      if (resolution.kind === "replay") {
        return {
          replayed: true,
          httpStatus: resolution.httpStatus,
          responseBody: resolution.responseBody,
        };
      }

      if (
        resolution.kind === "retry_after_stale" ||
        resolution.kind === "retry_after_failed"
      ) {
        inserted = await reacquireIdempotencyRecord(
          {
            id: existing.id,
            requestHash,
            expiresAt,
          },
          client
        );

        if (!inserted) {
          throw new AppError(
            "An identical request is already in progress.",
            409,
            IDEMPOTENCY_ERROR_CODES.REQUEST_IN_PROGRESS
          );
        }
      }
    }

    logIdempotencyEvent("created", {
      operation,
      actorScope,
      keyFingerprint,
      recordId: inserted.id,
    });

    try {
      const result = await execute(client);

      const safeBody = stripForbiddenReplayFields(
        sanitizeResponseBody(result.responseBody)
      );

      await completeIdempotencyRecord(
        {
          id: inserted.id,
          resourceType: result.resourceType ?? null,
          resourceId: result.resourceId ?? null,
          httpStatus: result.httpStatus,
          responseBody: safeBody,
          expiresAt,
        },
        client
      );

      return {
        replayed: false,
        httpStatus: result.httpStatus,
        responseBody: safeBody,
      };
    } catch (error) {
      if (isAppError(error) && error.statusCode < 500) {
        const terminalBody = {
          success: false,
          message: error.message,
          code: error.code,
        };

        await markIdempotencyFailedTerminal(
          {
            id: inserted.id,
            httpStatus: error.statusCode,
            responseBody: terminalBody,
            errorCode: error.code,
            expiresAt,
          },
          client
        );

        throw error;
      }

      await markIdempotencyFailedRetryable(
        { id: inserted.id, errorCode: error.code ?? "INTERNAL_SERVER_ERROR" },
        client
      );

      throw error;
    }
  });
}

export async function cleanupExpiredIdempotencyRecords(options = {}) {
  const deletedIds = await deleteExpiredIdempotencyRecords(options);

  if (deletedIds.length > 0) {
    logIdempotencyEvent("cleanup_count", { count: deletedIds.length });
  }

  return deletedIds.length;
}

export { shortKeyFingerprint };
