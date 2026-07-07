import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { withApp } from "../helpers/httpClient.js";
import { registerAndLogin, verifyUserEmail } from "../helpers/authTestHelpers.js";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
});

async function verifiedSession(client, email) {
  const session = await registerAndLogin(client, {
    fullName: "Draft User",
    email,
    password: "longenough1",
  });
  verifyUserEmail(store, email);
  return session;
}

test("GET /api/account/intake/draft returns 204 when no draft exists", async () => {
  await withApp(app, async (client) => {
    const session = await verifiedSession(client, "draft@example.com");

    const res = await client.get("/api/account/intake/draft", {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    assert.equal(res.status, 204);
  });
});

test("PUT /api/account/intake/draft stores and returns user-owned draft", async () => {
  await withApp(app, async (client) => {
    const session = await verifiedSession(client, "draft2@example.com");

    const save = await client.put(
      "/api/account/intake/draft",
      {
        data: {
          firstName: "Ada",
          email: "ada@example.com",
          caseType: "Family petition",
        },
        version: null,
      },
      { headers: { Authorization: `Bearer ${session.token}` } }
    );

    assert.equal(save.status, 200);
    assert.equal(save.body.data.firstName, "Ada");
    assert.equal(save.body.version, 1);

    const load = await client.get("/api/account/intake/draft", {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    assert.equal(load.status, 200);
    assert.equal(load.body.data.email, "ada@example.com");
  });
});

test("DELETE /api/account/intake/draft removes draft", async () => {
  await withApp(app, async (client) => {
    const session = await verifiedSession(client, "draft3@example.com");

    await client.put(
      "/api/account/intake/draft",
      { data: { firstName: "Temp" }, version: null },
      { headers: { Authorization: `Bearer ${session.token}` } }
    );

    const del = await client.delete("/api/account/intake/draft", {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    assert.equal(del.status, 204);

    const load = await client.get("/api/account/intake/draft", {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    assert.equal(load.status, 204);
  });
});

test("draft version conflict returns 409", async () => {
  await withApp(app, async (client) => {
    const session = await verifiedSession(client, "draft4@example.com");

    const first = await client.put(
      "/api/account/intake/draft",
      { data: { firstName: "One" }, version: null },
      { headers: { Authorization: `Bearer ${session.token}` } }
    );

    const conflict = await client.put(
      "/api/account/intake/draft",
      { data: { firstName: "Two" }, version: 999 },
      { headers: { Authorization: `Bearer ${session.token}` } }
    );

    assert.equal(first.status, 200);
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.code, "INTAKE_DRAFT_VERSION_CONFLICT");
  });
});

test("account and auth responses include Cache-Control: no-store", async () => {
  await withApp(app, async (client) => {
    const session = await verifiedSession(client, "cache@example.com");

    const me = await client.get("/api/auth/me", {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    assert.equal(me.headers["cache-control"], "no-store");

    const draft = await client.get("/api/account/intake/draft", {
      headers: { Authorization: `Bearer ${session.token}` },
    });

    assert.equal(draft.headers["cache-control"], "no-store");
  });
});

test("health endpoint is not forced to no-store", async () => {
  await withApp(app, async (client) => {
    const res = await client.get("/api/health");
    assert.equal(res.status, 200);
    assert.notEqual(res.headers["cache-control"], "no-store");
  });
});
