import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  beginIdempotentCommand,
  clearIdempotentCommand,
  createIdempotencyKey,
  idempotencyHeaders,
  isIdempotencyConflict,
  isIdempotencyInProgress,
  markIdempotentCommandSuccess,
  resetIdempotencyStateForTests,
} from "../src/services/idempotency.js";

beforeEach(() => {
  resetIdempotencyStateForTests();
});

test("creates a new key for a new command", () => {
  const key = beginIdempotentCommand("POST", "/account/intake");
  assert.match(key, /^[0-9a-f-]{36}$/i);
});

test("retry reuses the same key", () => {
  const first = beginIdempotentCommand("POST", "/account/intake");
  const second = beginIdempotentCommand("POST", "/account/intake");
  assert.equal(first, second);
});

test("fresh intentional command gets a new key", () => {
  beginIdempotentCommand("POST", "/account/intake");
  clearIdempotentCommand("POST", "/account/intake");
  const next = beginIdempotentCommand("POST", "/account/intake");
  assert.match(next, /^[0-9a-f-]{36}$/i);
});

test("success clears temporary retry state", () => {
  const first = beginIdempotentCommand("POST", "/account/intake");
  markIdempotentCommandSuccess("POST", "/account/intake");
  const second = beginIdempotentCommand("POST", "/account/intake");
  assert.notEqual(first, second);
});

test("idempotency headers never include URL fragments", () => {
  const headers = idempotencyHeaders("POST", "/account/intake");
  assert.ok(headers["Idempotency-Key"]);
  assert.doesNotMatch(headers["Idempotency-Key"], /@/);
});

test("conflict and in-progress helpers recognize backend codes", () => {
  assert.equal(isIdempotencyConflict({ code: "idempotency_key_conflict" }), true);
  assert.equal(isIdempotencyInProgress({ code: "idempotency_request_in_progress" }), true);
});

test("generated keys are not reused as static identifiers", () => {
  const a = createIdempotencyKey();
  const b = createIdempotencyKey();
  assert.notEqual(a, b);
});
