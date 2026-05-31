import test from "node:test";
import assert from "node:assert/strict";
import {
  assertLeadStateTransition,
  LEAD_STATE_TRANSITIONS,
} from "../../src/domain/lead-state.policy.js";

test("assertLeadStateTransition allows valid transitions", () => {
  assert.doesNotThrow(() => assertLeadStateTransition("prospective", "conflict_check"));
  assert.doesNotThrow(() => assertLeadStateTransition("attorney_review", "accepted"));
  assert.doesNotThrow(() => assertLeadStateTransition("accepted", "filed"));
});

test("assertLeadStateTransition rejects invalid transitions", () => {
  assert.throws(() => assertLeadStateTransition("prospective", "accepted"), {
    name: "AppError",
    statusCode: 400,
    code: "INVALID_LEAD_STATE_TRANSITION",
  });

  assert.throws(() => assertLeadStateTransition("filed", "accepted"), {
    name: "AppError",
    statusCode: 400,
    code: "INVALID_LEAD_STATE_TRANSITION",
  });
});

test("declined and filed are terminal states", () => {
  assert.deepEqual(LEAD_STATE_TRANSITIONS.declined, []);
  assert.deepEqual(LEAD_STATE_TRANSITIONS.filed, []);
});
