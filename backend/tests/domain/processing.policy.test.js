import test from "node:test";
import assert from "node:assert/strict";
import {
  assertProcessingNotRestricted,
  isProcessingRestricted,
} from "../../src/domain/processing.policy.js";

test("isProcessingRestricted returns true for snake_case or camelCase fields", () => {
  assert.equal(isProcessingRestricted({ processing_restricted_at: new Date() }), true);
  assert.equal(isProcessingRestricted({ processingRestrictedAt: new Date() }), true);
  assert.equal(isProcessingRestricted({}), false);
});

test("assertProcessingNotRestricted throws 403 when restricted", () => {
  assert.throws(
    () => assertProcessingNotRestricted({ processingRestrictedAt: new Date() }),
    (err) => {
      assert.equal(err.statusCode, 403);
      assert.match(err.message, /restricted/i);
      return true;
    }
  );
});

test("assertProcessingNotRestricted allows active users", () => {
  assert.doesNotThrow(() =>
    assertProcessingNotRestricted({ id: "u1", processingRestrictedAt: null })
  );
});
