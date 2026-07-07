import test from "node:test";
import assert from "node:assert/strict";
import { NOT_CONFIGURED_STATUS } from "../../src/constants/domain.js";

async function loadDocketwiseService(t, envOverrides = {}) {
  t.mock.module("../../src/config/env.js", {
    defaultExport: {
      DOCKETWISE_API_URL: "",
      DOCKETWISE_API_TOKEN: "",
      ...envOverrides,
    },
  });

  t.mock.module("../../src/services/access.service.js", {
    namedExports: {
      assertAdminAccess: () => {},
    },
  });

  const leadRepo = {
    findLeadById: async () => ({ id: "11111111-1111-1111-1111-111111111111" }),
    findLatestIntakeByLeadId: async () => ({ id: "22222222-2222-2222-2222-222222222222" }),
    findLatestDocketwiseSyncByLeadId: async () => null,
    updateIntakeDocketwiseStatusByLeadId: async () => {},
  };

  t.mock.module("../../src/repositories/lead.repository.js", {
    namedExports: leadRepo,
  });

  const syncCalls = [];
  t.mock.module("../../src/repositories/docketwise.repository.js", {
    namedExports: {
      createDocketwiseSyncRecord: async (payload) => {
        syncCalls.push(payload);
        return { ...payload, lead_id: payload.leadId };
      },
      updateDocketwiseSyncById: async (id, payload) => ({ id, ...payload }),
    },
  });

  t.mock.module("../../src/repositories/unit-of-work.repository.js", {
    namedExports: {
      withUnitOfWork: async (callback) => callback({}),
    },
  });

  const service = await import(
    `../../src/services/docketwise-admin.service.js?case=${Math.random()}`
  );

  return { ...service, syncCalls };
}

test("syncLeadToDocketwise does not return synced when provider is not configured", async (t) => {
  const { syncLeadToDocketwise, syncCalls } = await loadDocketwiseService(t);

  const result = await syncLeadToDocketwise({
    leadId: "11111111-1111-1111-1111-111111111111",
    actor: { id: "admin", role: "admin" },
  });

  assert.equal(result.success, false);
  assert.equal(result.configured, false);
  assert.equal(syncCalls[0].status, NOT_CONFIGURED_STATUS);
  assert.equal(syncCalls[0].externalId, null);
  assert.doesNotMatch(result.message, /synced/i);
});

test("syncLeadToDocketwise does not fabricate external IDs", async (t) => {
  const { syncLeadToDocketwise, syncCalls } = await loadDocketwiseService(t);
  await syncLeadToDocketwise({
    leadId: "11111111-1111-1111-1111-111111111111",
    actor: { id: "admin", role: "admin" },
  });

  assert.equal(syncCalls[0].externalId, null);
});
