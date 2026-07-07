import { randomUUID } from "crypto";
import { IDEMPOTENCY_STATES } from "../../src/constants/idempotency.js";

function scopeKey(actorScope, operation, idempotencyKeyHash) {
  return `${actorScope}\0${operation}\0${idempotencyKeyHash}`;
}

export function buildIdempotencyRepo(store) {
  if (!store.idempotencyRecords) {
    store.idempotencyRecords = new Map();
  }

  function mapRow(record) {
    if (!record) return null;
    return { ...record };
  }

  return {
    insertIdempotencyProcessing({
      actorScope,
      operation,
      idempotencyKeyHash,
      requestHash,
      expiresAt,
    }) {
      const key = scopeKey(actorScope, operation, idempotencyKeyHash);

      if (store.idempotencyRecords.has(key)) {
        return null;
      }

      const record = {
        id: randomUUID(),
        actorScope,
        operation,
        idempotencyKeyHash,
        requestHash,
        state: IDEMPOTENCY_STATES.PROCESSING,
        resourceType: null,
        resourceId: null,
        httpStatus: null,
        responseBody: null,
        errorCode: null,
        lockedAt: new Date(),
        completedAt: null,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.idempotencyRecords.set(key, record);
      return mapRow(record);
    },

    findIdempotencyRecordForUpdate({ actorScope, operation, idempotencyKeyHash }) {
      const key = scopeKey(actorScope, operation, idempotencyKeyHash);
      return mapRow(store.idempotencyRecords.get(key));
    },

    completeIdempotencyRecord({
      id,
      resourceType,
      resourceId,
      httpStatus,
      responseBody,
      expiresAt,
    }) {
      const record = [...store.idempotencyRecords.values()].find((row) => row.id === id);

      if (!record) return null;

      record.state = IDEMPOTENCY_STATES.COMPLETED;
      record.resourceType = resourceType ?? null;
      record.resourceId = resourceId ?? null;
      record.httpStatus = httpStatus;
      record.responseBody = responseBody;
      record.completedAt = new Date();
      record.expiresAt = expiresAt;
      record.updatedAt = new Date();

      return mapRow(record);
    },

    markIdempotencyFailedRetryable({ id, errorCode }) {
      const record = [...store.idempotencyRecords.values()].find((row) => row.id === id);

      if (!record) return null;

      record.state = IDEMPOTENCY_STATES.FAILED_RETRYABLE;
      record.errorCode = errorCode ?? null;
      record.updatedAt = new Date();

      return mapRow(record);
    },

    markIdempotencyFailedTerminal({ id, httpStatus, responseBody, errorCode, expiresAt }) {
      const record = [...store.idempotencyRecords.values()].find((row) => row.id === id);

      if (!record) return null;

      record.state = IDEMPOTENCY_STATES.FAILED_TERMINAL;
      record.httpStatus = httpStatus;
      record.responseBody = responseBody;
      record.errorCode = errorCode ?? null;
      record.completedAt = new Date();
      record.expiresAt = expiresAt;
      record.updatedAt = new Date();

      return mapRow(record);
    },

    deleteExpiredIdempotencyRecords({ limit = 500, now = new Date() }) {
      const deleted = [];

      for (const [key, record] of store.idempotencyRecords.entries()) {
        if (deleted.length >= limit) break;

        if (
          new Date(record.expiresAt) <= now &&
          [
            IDEMPOTENCY_STATES.COMPLETED,
            IDEMPOTENCY_STATES.FAILED_TERMINAL,
            IDEMPOTENCY_STATES.FAILED_RETRYABLE,
          ].includes(record.state)
        ) {
          store.idempotencyRecords.delete(key);
          deleted.push(record.id);
        }
      }

      return deleted;
    },

    reclaimStaleProcessingRecord({ id }) {
      const record = [...store.idempotencyRecords.values()].find((row) => row.id === id);

      if (!record || record.state !== IDEMPOTENCY_STATES.PROCESSING) {
        return null;
      }

      record.state = IDEMPOTENCY_STATES.FAILED_RETRYABLE;
      record.errorCode = "stale_processing";
      record.updatedAt = new Date();

      return mapRow(record);
    },

    reacquireIdempotencyRecord({ id, requestHash, expiresAt }) {
      const record = [...store.idempotencyRecords.values()].find((row) => row.id === id);

      if (
        !record ||
        record.state !== IDEMPOTENCY_STATES.FAILED_RETRYABLE ||
        record.requestHash !== requestHash
      ) {
        return null;
      }

      record.state = IDEMPOTENCY_STATES.PROCESSING;
      record.requestHash = requestHash;
      record.lockedAt = new Date();
      record.expiresAt = expiresAt;
      record.httpStatus = null;
      record.responseBody = null;
      record.errorCode = null;
      record.completedAt = null;
      record.resourceType = null;
      record.resourceId = null;
      record.updatedAt = new Date();

      return mapRow(record);
    },
  };
}
