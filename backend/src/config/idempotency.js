import { createHmac } from "crypto";
import env from "./env.js";

const DEFAULT_HMAC_SECRET = "development-idempotency-hmac-secret-change-me";
const PLACEHOLDER_HMAC_SECRET = "replace-with-idempotency-hmac-secret";

function resolveHmacSecret() {
  const configured = process.env.IDEMPOTENCY_KEY_HMAC_SECRET?.trim();

  if (configured) {
    return configured;
  }

  if (env.isProduction) {
    return "";
  }

  return DEFAULT_HMAC_SECRET;
}

const hmacSecret = resolveHmacSecret();

if (env.isProduction && !hmacSecret) {
  throw new Error("IDEMPOTENCY_KEY_HMAC_SECRET must be set in production");
}

if (
  env.isProduction &&
  [DEFAULT_HMAC_SECRET, PLACEHOLDER_HMAC_SECRET].includes(hmacSecret)
) {
  throw new Error(
    "IDEMPOTENCY_KEY_HMAC_SECRET must not use a default or placeholder value in production"
  );
}

const defaultTtlSeconds = Number(process.env.IDEMPOTENCY_DEFAULT_TTL_SECONDS ?? 86400);
const processingTimeoutSeconds = Number(
  process.env.IDEMPOTENCY_PROCESSING_TIMEOUT_SECONDS ?? 300
);
const maxKeyLength = Number(process.env.IDEMPOTENCY_MAX_KEY_LENGTH ?? 128);
const maxResponseBytes = Number(process.env.IDEMPOTENCY_MAX_RESPONSE_BYTES ?? 65536);

if (!Number.isInteger(defaultTtlSeconds) || defaultTtlSeconds < 60) {
  throw new Error("IDEMPOTENCY_DEFAULT_TTL_SECONDS must be an integer >= 60");
}

if (!Number.isInteger(processingTimeoutSeconds) || processingTimeoutSeconds < 30) {
  throw new Error("IDEMPOTENCY_PROCESSING_TIMEOUT_SECONDS must be an integer >= 30");
}

if (!Number.isInteger(maxKeyLength) || maxKeyLength < 16 || maxKeyLength > 256) {
  throw new Error("IDEMPOTENCY_MAX_KEY_LENGTH must be an integer between 16 and 256");
}

if (!Number.isInteger(maxResponseBytes) || maxResponseBytes < 1024) {
  throw new Error("IDEMPOTENCY_MAX_RESPONSE_BYTES must be an integer >= 1024");
}

export const idempotencyConfig = Object.freeze({
  hmacSecret,
  defaultTtlSeconds,
  processingTimeoutSeconds,
  maxKeyLength,
  maxResponseBytes,
});

export function fingerprintIdempotencyKey(normalizedKey) {
  return createHmac("sha256", idempotencyConfig.hmacSecret)
    .update(normalizedKey, "utf8")
    .digest("hex");
}

export function shortKeyFingerprint(keyHash) {
  return keyHash.slice(0, 12);
}
