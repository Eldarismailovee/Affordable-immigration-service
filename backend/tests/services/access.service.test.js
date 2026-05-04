import test from "node:test";
import assert from "node:assert/strict";

const ADMIN_USER = { id: "admin-1", role: "admin" };
const REGULAR_USER = { id: "user-1", role: "user" };

async function loadAccessService(t, { findLeadById }) {
  t.mock.module("../../src/repositories/lead.repository.js", {
    namedExports: { findLeadById },
  });

  return import(`../../src/services/access.service.js?case=${Math.random()}`);
}

test("assertLeadAccess throws 401 when no user is provided", async (t) => {
  const { assertLeadAccess } = await loadAccessService(t, {
    findLeadById: async () => {
      throw new Error("should not be called");
    },
  });

  await assert.rejects(assertLeadAccess(null, "lead-1"), (err) => {
    assert.equal(err.statusCode, 401);
    assert.match(err.message, /Authentication required/);
    return true;
  });
});

test("assertLeadAccess throws 404 when the lead does not exist", async (t) => {
  const { assertLeadAccess } = await loadAccessService(t, {
    findLeadById: async () => null,
  });

  await assert.rejects(assertLeadAccess(REGULAR_USER, "missing"), (err) => {
    assert.equal(err.statusCode, 404);
    assert.match(err.message, /Lead not found/);
    return true;
  });
});

test("assertLeadAccess throws 403 (IDOR) when the lead belongs to another user", async (t) => {
  const otherLead = { id: "lead-2", user_id: "someone-else" };
  const { assertLeadAccess } = await loadAccessService(t, {
    findLeadById: async () => otherLead,
  });

  await assert.rejects(assertLeadAccess(REGULAR_USER, "lead-2"), (err) => {
    assert.equal(err.statusCode, 403);
    assert.match(err.message, /do not have access/);
    return true;
  });
});

test("assertLeadAccess returns the lead when the lead belongs to the user", async (t) => {
  const ownLead = { id: "lead-3", user_id: REGULAR_USER.id };
  const { assertLeadAccess } = await loadAccessService(t, {
    findLeadById: async () => ownLead,
  });

  const result = await assertLeadAccess(REGULAR_USER, "lead-3");
  assert.deepEqual(result, ownLead);
});

test("assertLeadAccess returns the lead when the user is an admin (regardless of ownership)", async (t) => {
  const otherLead = { id: "lead-4", user_id: "another-user" };
  const { assertLeadAccess } = await loadAccessService(t, {
    findLeadById: async () => otherLead,
  });

  const result = await assertLeadAccess(ADMIN_USER, "lead-4");
  assert.deepEqual(result, otherLead);
});

test("assertLeadAccess returns the lead even when its user_id is null and the caller is admin", async (t) => {
  const ownerlessLead = { id: "lead-5", user_id: null };
  const { assertLeadAccess } = await loadAccessService(t, {
    findLeadById: async () => ownerlessLead,
  });

  const result = await assertLeadAccess(ADMIN_USER, "lead-5");
  assert.deepEqual(result, ownerlessLead);
});

test("assertLeadAccess denies regular users access to ownerless leads", async (t) => {
  const ownerlessLead = { id: "lead-6", user_id: null };
  const { assertLeadAccess } = await loadAccessService(t, {
    findLeadById: async () => ownerlessLead,
  });

  await assert.rejects(assertLeadAccess(REGULAR_USER, "lead-6"), (err) => {
    assert.equal(err.statusCode, 403);
    return true;
  });
});
