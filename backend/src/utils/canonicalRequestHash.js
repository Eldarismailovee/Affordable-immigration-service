import { createHash } from "crypto";

/**
 * Canonical JSON serialization for idempotency request hashing.
 * - Object keys sorted recursively
 * - Arrays preserve order
 * - null preserved; undefined omitted
 * - Numbers as JSON numbers (no numeric string coercion)
 * - Duplicate JSON keys: last value wins (matches JSON.parse behavior)
 */
export function canonicalizeValue(value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => {
      const normalized = canonicalizeValue(entry);
      return normalized === undefined ? null : normalized;
    });
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const sortedKeys = Object.keys(value).sort();
  const result = {};

  for (const key of sortedKeys) {
    const normalized = canonicalizeValue(value[key]);

    if (normalized !== undefined) {
      result[key] = normalized;
    }
  }

  return result;
}

export function canonicalJsonString(value) {
  return JSON.stringify(canonicalizeValue(value));
}

export function computeRequestHash({
  operation,
  actorScope,
  body = null,
  pathParams = null,
  queryParams = null,
}) {
  const payload = canonicalizeValue({
    operation,
    actorScope,
    body: body ?? null,
    pathParams: pathParams ?? null,
    queryParams: queryParams ?? null,
  });

  return createHash("sha256").update(canonicalJsonString(payload), "utf8").digest("hex");
}
