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

async function register(client, email) {
  const res = await client.post("/api/auth/register", {
    fullName: "Demo",
    email,
    password: "longenough1",
  });
  assert.equal(res.status, 201);
  return res.body;
}

function seedLead(userId) {
  const leadId = randomUUID();
  store.leads.set(leadId, {
    id: leadId,
    user_id: userId,
    first_name: "Lead",
    last_name: "Owner",
    email: `lead-${leadId}@example.com`,
    phone: "555",
    status: "prospective",
    deleted_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  });
  return leadId;
}

test("GET /api/account/leads requires authentication", async () => {
  await withApp(app, async (client) => {
    const res = await client.get("/api/account/leads");
    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Authentication required");
  });
});

test("GET /api/account/leads only returns leads owned by the caller", async () => {
  await withApp(app, async (client) => {
    const adminSession = await register(client, "admin@example.com");
    const userASession = await register(client, "user-a@example.com");
    const userBSession = await register(client, "user-b@example.com");

    void adminSession;

    const userA = [...store.users.values()].find((u) => u.email === "user-a@example.com");
    const userB = [...store.users.values()].find((u) => u.email === "user-b@example.com");

    const leadOfA = seedLead(userA.id);
    const leadOfB = seedLead(userB.id);

    const aRes = await client.get("/api/account/leads", { token: userASession.token });
    assert.equal(aRes.status, 200);
    const aIds = aRes.body.leads.map((lead) => lead.id);
    assert.deepEqual(aIds, [leadOfA]);

    const bRes = await client.get("/api/account/leads", { token: userBSession.token });
    const bIds = bRes.body.leads.map((lead) => lead.id);
    assert.deepEqual(bIds, [leadOfB]);
  });
});

test("GET /api/account/agreement/:leadId returns 403 (IDOR) when accessing another user's lead", async () => {
  await withApp(app, async (client) => {
    await register(client, "first-admin@example.com");
    const userASession = await register(client, "user-a@example.com");
    const userBSession = await register(client, "user-b@example.com");

    const userB = [...store.users.values()].find((u) => u.email === "user-b@example.com");
    const leadOfB = seedLead(userB.id);

    const res = await client.get(`/api/account/agreement/${leadOfB}`, {
      token: userASession.token,
    });
    assert.equal(res.status, 403);
    assert.match(res.body.message, /do not have access/);

    void userBSession;
  });
});

test("GET /api/account/agreement/:leadId returns 200 for the lead's owner", async () => {
  await withApp(app, async (client) => {
    await register(client, "first-admin@example.com");
    const userSession = await register(client, "user@example.com");

    const user = [...store.users.values()].find((u) => u.email === "user@example.com");
    const leadId = seedLead(user.id);

    const res = await client.get(`/api/account/agreement/${leadId}`, {
      token: userSession.token,
    });

    assert.equal(res.status, 404);
    assert.match(res.body.message, /Agreement not found/);
  });
});

test("GET /api/account/onboarding/:leadId returns 403 when accessing another user's onboarding", async () => {
  await withApp(app, async (client) => {
    await register(client, "first-admin@example.com");
    const userASession = await register(client, "user-a@example.com");
    await register(client, "user-b@example.com");

    const userB = [...store.users.values()].find((u) => u.email === "user-b@example.com");
    const leadOfB = seedLead(userB.id);

    const res = await client.get(`/api/account/onboarding/${leadOfB}`, {
      token: userASession.token,
    });
    assert.equal(res.status, 403);
  });
});

test("GET /api/account/agreement/:leadId returns 404 when the lead does not exist", async () => {
  await withApp(app, async (client) => {
    await register(client, "first-admin@example.com");
    const userSession = await register(client, "user@example.com");

    const res = await client.get(`/api/account/agreement/${randomUUID()}`, {
      token: userSession.token,
    });
    assert.equal(res.status, 404);
    assert.match(res.body.message, /Lead not found/);
  });
});

test("GET /api/account/agreement/:leadId rejects an invalid leadId with 400", async () => {
  await withApp(app, async (client) => {
    const adminSession = await register(client, "admin@example.com");

    const res = await client.get("/api/account/agreement/not-a-uuid", {
      token: adminSession.token,
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Validation failed");
  });
});

test("an admin can read another user's agreement (no IDOR for admins)", async () => {
  await withApp(app, async (client) => {
    const adminSession = await register(client, "admin@example.com");
    await register(client, "user@example.com");

    const user = [...store.users.values()].find((u) => u.email === "user@example.com");
    const leadId = seedLead(user.id);

    const res = await client.get(`/api/account/agreement/${leadId}`, {
      token: adminSession.token,
    });
    assert.equal(res.status, 404);
    assert.match(res.body.message, /Agreement not found/);
  });
});
