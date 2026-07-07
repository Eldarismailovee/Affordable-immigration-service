import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalJsonString,
  canonicalizeValue,
  computeRequestHash,
} from "../../src/utils/canonicalRequestHash.js";
import { normalizeIdempotencyKey, validateIdempotencyKey } from "../../src/utils/idempotencyKey.js";
import { AppError } from "../../src/utils/appError.js";

test("canonical hash ignores JSON key order", () => {
  const left = computeRequestHash({
    operation: "intake.create",
    actorScope: "user:abc",
    body: { b: 1, a: 2 },
  });
  const right = computeRequestHash({
    operation: "intake.create",
    actorScope: "user:abc",
    body: { a: 2, b: 1 },
  });

  assert.equal(left, right);
});

test("canonical hash changes when payload field changes", () => {
  const left = computeRequestHash({
    operation: "intake.create",
    actorScope: "user:abc",
    body: { a: 1 },
  });
  const right = computeRequestHash({
    operation: "intake.create",
    actorScope: "user:abc",
    body: { a: 2 },
  });

  assert.notEqual(left, right);
});

test("canonical hash includes path parameters", () => {
  const left = computeRequestHash({
    operation: "admin.user.role.change",
    actorScope: "admin:1",
    body: { role: "user" },
    pathParams: { userId: "u1" },
  });
  const right = computeRequestHash({
    operation: "admin.user.role.change",
    actorScope: "admin:1",
    body: { role: "user" },
    pathParams: { userId: "u2" },
  });

  assert.notEqual(left, right);
});

test("canonicalizeValue omits undefined and preserves null", () => {
  assert.equal(canonicalJsonString({ a: null }), canonicalJsonString({ a: null }));
  assert.notEqual(
    canonicalJsonString({ a: null }),
    canonicalJsonString({})
  );
  assert.equal(canonicalizeValue(undefined), undefined);
});

test("idempotency key validation rejects missing, empty, long, and control chars", () => {
  assert.throws(() => validateIdempotencyKey(""), (error) => {
    assert.ok(error instanceof AppError);
    assert.equal(error.code, "idempotency_key_required");
    return true;
  });

  assert.throws(() => validateIdempotencyKey("a".repeat(200)), (error) => {
    assert.equal(error.code, "invalid_idempotency_key");
    return true;
  });

  assert.throws(() => validateIdempotencyKey("bad\nkey"), (error) => {
    assert.equal(error.code, "invalid_idempotency_key");
    return true;
  });
});

test("idempotency key normalization trims outer whitespace", () => {
  const parsed = validateIdempotencyKey("  stable-key-123  ");
  assert.equal(parsed.normalized, "stable-key-123");
  assert.equal(normalizeIdempotencyKey("  stable-key-123  "), "stable-key-123");
});

test("idempotency key rejects email-like values", () => {
  assert.throws(() => validateIdempotencyKey("user@example.com"), (error) => {
    assert.equal(error.code, "invalid_idempotency_key");
    return true;
  });
});
