import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCanAccessLead,
  canAccessLead,
} from "../../src/domain/lead.policy.js";

const ADMIN = { id: "admin-1", role: "admin" };
const USER = { id: "user-1", role: "user" };
const ATTORNEY = { id: "attorney-1", role: "attorney" };

test("canAccessLead allows admins to read any lead", () => {
  assert.equal(canAccessLead(ADMIN, { id: "lead-1", user_id: "other", status: "new" }), true);
});

test("canAccessLead allows attorneys to read workflow leads", () => {
  assert.equal(
    canAccessLead(ATTORNEY, { id: "lead-1", user_id: "other", status: "attorney_review" }),
    true
  );
  assert.equal(
    canAccessLead(ATTORNEY, { id: "lead-2", user_id: "other", status: "new" }),
    true
  );
});

test("canAccessLead allows users to read only their own leads", () => {
  assert.equal(canAccessLead(USER, { id: "lead-1", user_id: "user-1" }), true);
  assert.equal(canAccessLead(USER, { id: "lead-2", user_id: "other" }), false);
  assert.equal(canAccessLead(USER, { id: "lead-3", user_id: null }), false);
});

test("assertCanAccessLead throws AppError for anonymous or unauthorized access", () => {
  assert.throws(() => assertCanAccessLead(null, { id: "lead-1", user_id: "user-1" }), {
    name: "AppError",
    statusCode: 401,
    code: "AUTHENTICATION_REQUIRED",
  });

  assert.throws(() => assertCanAccessLead(USER, { id: "lead-2", user_id: "other" }), {
    name: "AppError",
    statusCode: 403,
    code: "LEAD_ACCESS_DENIED",
  });
});
