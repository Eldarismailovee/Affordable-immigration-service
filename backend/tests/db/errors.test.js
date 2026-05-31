import assert from "node:assert/strict";
import { test } from "node:test";
import { isUniqueViolation } from "../../src/db/errors.js";

test("isUniqueViolation detects PostgreSQL unique constraint errors", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
  assert.equal(isUniqueViolation({ code: "23503" }), false);
  assert.equal(isUniqueViolation(null), false);
});
