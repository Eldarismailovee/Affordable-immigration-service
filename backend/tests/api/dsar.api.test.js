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

async function register(client, email, fullName = "Demo User") {
  const res = await client.post("/api/auth/register", {
    fullName,
    email,
    password: "longenough1",
  });
  assert.equal(res.status, 201);
  return res.body;
}

async function makeAdmin(client) {
  return register(client, `admin-${randomUUID().slice(0, 8)}@example.com`, "Admin");
}

async function makeUser(client, email = "user@example.com") {
  const hasAdmin = [...store.users.values()].some((u) => u.role === "admin");
  if (!hasAdmin) {
    await register(client, `bootstrap-${randomUUID().slice(0, 8)}@example.com`, "Bootstrap");
  }
  return register(client, email);
}

function findUser(email) {
  return [...store.users.values()].find((u) => u.email === email);
}

function setProcessingRestricted(userId) {
  const user = store.users.get(userId);
  user.processing_restricted_at = new Date();
  user.processing_restriction_reason = "DSAR restriction";
}

test("POST /api/account/dsar creates an export request", async () => {
  await withApp(app, async (client) => {
    const session = await makeUser(client);
    const res = await client.post(
      "/api/account/dsar",
      { type: "export", message: "Please export my data." },
      { token: session.token }
    );
    assert.equal(res.status, 201);
    assert.equal(res.body.request.type, "export");
    assert.equal(res.body.request.status, "identity_verification_required");
  });
});

test("GET /api/account/dsar returns only the caller's requests", async () => {
  await withApp(app, async (client) => {
    const userA = await makeUser(client, "user-a@example.com");
    const userB = await makeUser(client, "user-b@example.com");

    await client.post(
      "/api/account/dsar",
      { type: "export", message: "A export" },
      { token: userA.token }
    );
    await client.post(
      "/api/account/dsar",
      { type: "restriction", message: "B restrict" },
      { token: userB.token }
    );

    const aList = await client.get("/api/account/dsar", { token: userA.token });
    assert.equal(aList.status, 200);
    assert.equal(aList.body.requests.length, 1);
    assert.equal(aList.body.requests[0].type, "export");

    const bList = await client.get("/api/account/dsar", { token: userB.token });
    assert.equal(bList.body.requests.length, 1);
    assert.equal(bList.body.requests[0].type, "restriction");
  });
});

test("GET /api/account/dsar/:requestId returns 403 for another user's request", async () => {
  await withApp(app, async (client) => {
    const userA = await makeUser(client, "user-a@example.com");
    const userB = await makeUser(client, "user-b@example.com");

    const created = await client.post(
      "/api/account/dsar",
      { type: "export", message: "mine" },
      { token: userA.token }
    );
    const requestId = created.body.request.id;

    const res = await client.get(`/api/account/dsar/${requestId}`, { token: userB.token });
    assert.equal(res.status, 403);
  });
});

test("GET /api/account/dsar/:requestId/export returns 403 before identity verification", async () => {
  await withApp(app, async (client) => {
    const session = await makeUser(client);
    const created = await client.post(
      "/api/account/dsar",
      { type: "export", message: "export" },
      { token: session.token }
    );

    const res = await client.get(`/api/account/dsar/${created.body.request.id}/export`, {
      token: session.token,
    });
    assert.equal(res.status, 403);
    assert.match(res.body.message, /Identity verification/i);
  });
});

test("GET /api/admin/dsar requires admin or attorney role", async () => {
  await withApp(app, async (client) => {
    const userSession = await makeUser(client);

    const res = await client.get("/api/admin/dsar", { token: userSession.token });
    assert.equal(res.status, 403);
  });
});

test("GET /api/admin/dsar returns requests for admin", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const userSession = await makeUser(client, "client@example.com");

    await client.post(
      "/api/account/dsar",
      { type: "correction", message: "fix phone", requestedChanges: { phone: "+15551234" } },
      { token: userSession.token }
    );

    const res = await client.get("/api/admin/dsar", { token: adminSession.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.requests.length, 1);
    assert.equal(res.body.requests[0].requesterEmail, "client@example.com");
    assert.equal(res.body.requests[0].type, "correction");
  });
});

test("PATCH /api/admin/dsar/:requestId/identity marks verified and enables export flow", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const userSession = await makeUser(client);

    const created = await client.post(
      "/api/account/dsar",
      { type: "export", message: "export" },
      { token: userSession.token }
    );
    const requestId = created.body.request.id;

    const verify = await client.patch(
      `/api/admin/dsar/${requestId}/identity`,
      { status: "verified", notes: "Matched logged-in account" },
      { token: adminSession.token }
    );
    assert.equal(verify.status, 200);
    assert.equal(verify.body.request.identityVerificationStatus, "verified");

    const generate = await client.post(
      `/api/admin/dsar/${requestId}/export`,
      {},
      { token: adminSession.token }
    );
    assert.equal(generate.status, 200);

    const download = await client.get(`/api/account/dsar/${requestId}/export`, {
      token: userSession.token,
    });
    assert.equal(download.status, 200);
    assert.ok(download.body.export.user);
    assert.equal(download.body.export.user.password_hash, undefined);
  });
});

test("POST /api/account/intake returns 403 when processing is restricted", async () => {
  await withApp(app, async (client) => {
    const session = await makeUser(client);
    const user = findUser("user@example.com");
    setProcessingRestricted(user.id);

    const payload = {
      firstName: "Test",
      lastName: "User",
      email: "user@example.com",
      phone: "5551234567",
      caseType: "Family",
      selectedPackage: "guidance",
      additionalI130Count: 0,
      expedited: false,
      consultationType: "Zoom",
      preferredDateTime: "2026-06-01T10:00:00",
      billingName: "Test User",
      billingEmail: "user@example.com",
      paymentPreference: "invoice",
      consentManualProcessing: true,
    };

    const res = await client.post("/api/account/intake", payload, { token: session.token });
    assert.equal(res.status, 403);
    assert.match(res.body.message, /restricted/i);
  });
});

test("POST /api/account/dsar still works when processing is restricted", async () => {
  await withApp(app, async (client) => {
    const session = await makeUser(client);
    const user = findUser("user@example.com");
    setProcessingRestricted(user.id);

    const res = await client.post(
      "/api/account/dsar",
      { type: "export", message: "Still need my data" },
      { token: session.token }
    );
    assert.equal(res.status, 201);
  });
});

test("POST /api/admin/dsar/:requestId/anonymize returns 409 when legal hold is active", async () => {
  await withApp(app, async (client) => {
    const adminSession = await makeAdmin(client);
    const userSession = await makeUser(client);

    const created = await client.post(
      "/api/account/dsar",
      { type: "deletion", message: "delete me" },
      { token: userSession.token }
    );
    const requestId = created.body.request.id;

    await client.patch(
      `/api/admin/dsar/${requestId}/identity`,
      { status: "verified" },
      { token: adminSession.token }
    );

    await client.patch(
      `/api/admin/dsar/${requestId}/legal-hold`,
      { legalHold: true, reason: "Pending litigation" },
      { token: adminSession.token }
    );

    const res = await client.post(`/api/admin/dsar/${requestId}/anonymize`, {}, {
      token: adminSession.token,
    });
    assert.equal(res.status, 409);
    assert.match(res.body.message, /legal hold/i);
  });
});
