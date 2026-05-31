import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import { randomUUID } from "crypto";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { withApp } from "../helpers/httpClient.js";

let app;
let store;
let lastRunOptions = null;

before(async () => {
  mock.module("../../src/services/retention.service.js", {
    namedExports: {
      runRetentionJobs: async (options) => {
        lastRunOptions = options;
        return {
          dryRun: options.dryRun,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          results: {
            technical_log: { found: 1, deleted: options.dryRun ? 0 : 1 },
          },
        };
      },
      applyRetentionAdminAction: async ({ action, category, targetId, reason }) => ({
        action,
        category,
        targetId,
        applied: true,
        reason,
      }),
    },
  });

  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
  lastRunOptions = null;
});

async function registerAndLogin(client, { email, password = "longenough1", fullName = "Demo" }) {
  const res = await client.post("/api/auth/register", { fullName, email, password });
  assert.equal(res.status, 201);
  return res.body;
}

async function makeAdmin(client) {
  return registerAndLogin(client, { email: "admin@example.com" });
}

async function makeRegularUser(client, email = "user@example.com") {
  await registerAndLogin(client, { email: "first-admin@example.com" });
  return registerAndLogin(client, { email });
}

test("POST /api/admin/retention/run requires admin role", async () => {
  await withApp(app, async (client) => {
    const userSession = await makeRegularUser(client);

    const res = await client.post(
      "/api/admin/retention/run",
      {
        dryRun: true,
        reason: "Manual dry run from retention API test case.",
      },
      { token: userSession.token }
    );

    assert.equal(res.status, 403);
  });
});

test("POST /api/admin/retention/run accepts dryRun for admin", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);

    const res = await client.post(
      "/api/admin/retention/run",
      {
        dryRun: true,
        limit: 25,
        categories: ["technical_log"],
        reason: "Manual dry run from retention API test case.",
      },
      { token: adminSession.token }
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.dryRun, true);
    assert.equal(lastRunOptions.dryRun, true);
    assert.equal(lastRunOptions.limit, 25);
  });
});

test("POST /api/admin/retention/actions requires reason min length", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);

    const res = await client.post(
      "/api/admin/retention/actions",
      {
        action: "apply_legal_hold",
        category: "lead",
        targetId: randomUUID(),
        reason: "short",
      },
      { token: adminSession.token }
    );

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Validation failed");
  });
});

test("POST /api/admin/retention/actions applies override for admin", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const targetId = randomUUID();

    const res = await client.post(
      "/api/admin/retention/actions",
      {
        action: "apply_legal_hold",
        category: "lead",
        targetId,
        reason: "Preserve records pending external counsel review.",
      },
      { token: adminSession.token }
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.applied, true);
    assert.equal(res.body.targetId, targetId);
  });
});
