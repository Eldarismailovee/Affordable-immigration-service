import test from "node:test";
import assert from "node:assert/strict";
import {
  assertLeadStateTransition,
  LEAD_STATE_TRANSITIONS,
} from "../../src/domain/lead-state.policy.js";

test("assertLeadStateTransition allows valid transitions", () => {
  assert.doesNotThrow(() => assertLeadStateTransition("new", "conflict_check"));
  assert.doesNotThrow(() => assertLeadStateTransition("attorney_review", "accepted"));
  assert.doesNotThrow(() => assertLeadStateTransition("accepted", "engaged"));
  assert.doesNotThrow(() => assertLeadStateTransition("engaged", "filed"));
});

test("assertLeadStateTransition rejects invalid transitions", () => {
  assert.throws(() => assertLeadStateTransition("new", "accepted"), {
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
