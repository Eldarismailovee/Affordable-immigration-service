import { AppError } from "./appError.js";
import { IDEMPOTENCY_ERROR_CODES } from "../constants/idempotency.js";
import {
  fingerprintIdempotencyKey,
  idempotencyConfig,
  shortKeyFingerprint,
} from "../config/idempotency.js";

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;
const SAFE_KEY_PATTERN = /^[\x21-\x7E]+$/;
const PII_PATTERNS = [
  /@/,
  /^Bearer\s+/i,
  /^eyJ[A-Za-z0-9_-]+\./,
];

export function normalizeIdempotencyKey(rawKey) {
  if (rawKey === undefined || rawKey === null) {
    return null;
  }

  if (Array.isArray(rawKey)) {
    return null;
  }

  const trimmed = String(rawKey).trim();

  if (!trimmed) {
    return null;
  }

  return trimmed;
}

export function validateIdempotencyKey(rawKey) {
  const normalized = normalizeIdempotencyKey(rawKey);

  if (!normalized) {
    throw new AppError(
      "Idempotency-Key is required for this operation.",
      400,
      IDEMPOTENCY_ERROR_CODES.KEY_REQUIRED
    );
  }

  if (normalized.length > idempotencyConfig.maxKeyLength) {
    throw new AppError(
      "Idempotency-Key exceeds maximum allowed length.",
      400,
      IDEMPOTENCY_ERROR_CODES.INVALID_KEY
    );
  }

  if (CONTROL_CHAR_PATTERN.test(normalized) || !SAFE_KEY_PATTERN.test(normalized)) {
    throw new AppError(
      "Idempotency-Key contains invalid characters.",
      400,
      IDEMPOTENCY_ERROR_CODES.INVALID_KEY
    );
  }

  for (const pattern of PII_PATTERNS) {
    if (pattern.test(normalized)) {
      throw new AppError(
        "Idempotency-Key must not contain sensitive data.",
        400,
        IDEMPOTENCY_ERROR_CODES.INVALID_KEY
      );
    }
  }

  const keyHash = fingerprintIdempotencyKey(normalized);

  return {
    normalized,
    keyHash,
    fingerprint: shortKeyFingerprint(keyHash),
  };
}

export function parseIdempotencyKeyHeader(req) {
  const headerValue = req.headers["idempotency-key"];

  if (headerValue === undefined) {
    return null;
  }

  return validateIdempotencyKey(headerValue);
}
