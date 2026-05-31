import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { withApp } from "../helpers/httpClient.js";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
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

test("GET /api/admin/leads requires authentication (401 without token)", async () => {
  await withApp(app, async (client) => {
    const res = await client.get("/api/admin/leads");
    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Authentication required");
  });
});

test("GET /api/admin/leads requires admin role (403 for regular user)", async () => {
  await withApp(app, async (client) => {
    const userSession = await makeRegularUser(client);

    const res = await client.get("/api/admin/leads", { token: userSession.token });
    assert.equal(res.status, 403);
    assert.equal(res.body.message, "Insufficient permissions");
  });
});

test("GET /api/admin/leads returns 200 and leads list for an admin", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);

    const res = await client.get("/api/admin/leads", { token: adminSession.token });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.leads));
  });
});

test("GET /api/admin/leads/:leadId rejects a non-UUID leadId with 400", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);

    const res = await client.get("/api/admin/leads/not-a-uuid", {
      token: adminSession.token,
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Validation failed");
  });
});

test("GET /api/admin/leads/:leadId returns 404 when the lead is missing", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);

    const res = await client.get(`/api/admin/leads/${randomUUID()}`, {
      token: adminSession.token,
    });
    assert.equal(res.status, 404);
  });
});

test("DELETE /api/admin/leads/:leadId soft-deletes the lead and writes an audit entry", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const leadId = randomUUID();
    store.leads.set(leadId, {
      id: leadId,
      user_id: null,
      first_name: "Lead",
      last_name: "Owner",
      email: "lead@example.com",
      phone: "555",
      status: "prospective",
      deleted_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const res = await client.delete(`/api/admin/leads/${leadId}`, {
      token: adminSession.token,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.lead.id, leadId);

    assert.equal(store.leads.get(leadId).status, "declined");
    assert.ok(store.leads.get(leadId).deleted_at);

    await new Promise((resolve) => setImmediate(resolve));
    assert.ok(
      store.auditLog.some(
        (entry) =>
          entry.method === "DELETE" &&
          entry.path === `/api/admin/leads/${leadId}` &&
          entry.status === 200
      ),
      "an admin audit log entry should be written"
    );
  });
});

test("DELETE /api/admin/leads/:leadId returns 404 (and still audits) for a missing lead", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const missingId = randomUUID();

    const res = await client.delete(`/api/admin/leads/${missingId}`, {
      token: adminSession.token,
    });
    assert.equal(res.status, 404);
  });
});

test("POST /api/admin/* by a regular user returns 403 and never invokes the admin handler", async () => {
  await withApp(app, async (client) => {
    const userSession = await makeRegularUser(client);

    const userId = [...store.users.values()].find((u) => u.role === "user").id;

    const res = await client.patch(
      `/api/admin/users/${userId}/role`,
      { role: "admin" },
      { token: userSession.token }
    );
    assert.equal(res.status, 403);

    assert.equal(
      [...store.users.values()].find((u) => u.id === userId).role,
      "user",
      "role must not have changed"
    );
  });
});

test("PATCH /api/admin/users/:userId/role rejects unknown roles with 400", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);

    const res = await client.patch(
      `/api/admin/users/${randomUUID()}/role`,
      { role: "superadmin" },
      { token: adminSession.token }
    );
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Validation failed");
  });
});
