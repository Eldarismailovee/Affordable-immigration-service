import test from "node:test";
import assert from "node:assert/strict";
import { validatePrivilegedPassword } from "../../src/utils/passwordPolicy.js";

test("validatePrivilegedPassword accepts a strong password", () => {
  const result = validatePrivilegedPassword("StrongPass123");
  assert.equal(result.valid, true);
});

test("validatePrivilegedPassword rejects short passwords", () => {
  const result = validatePrivilegedPassword("Short1A");
  assert.equal(result.valid, false);
});

test("validatePrivilegedPassword rejects missing character classes", () => {
  const result = validatePrivilegedPassword("alllowercase123");
  assert.equal(result.valid, false);
});
