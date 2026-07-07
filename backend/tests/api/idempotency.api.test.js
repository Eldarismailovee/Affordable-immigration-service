import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { setupTestEnvironment, clearStore } from "../helpers/buildTestApp.js";
import { withApp } from "../helpers/httpClient.js";
import { registerAndLogin, verifyUserEmail } from "../helpers/authTestHelpers.js";
import { buildValidIntakePayload } from "../helpers/intakeTestPayload.js";
import { newIdempotencyKey, withIdempotencyKey } from "../helpers/idempotencyTestHelpers.js";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => clearStore(store));

test("POST /api/account/intake requires Idempotency-Key", async () => {
  await withApp(app, async (client) => {
    const session = await registerAndLogin(client, { email: "intake-user@example.com" });
    verifyUserEmail(store, session.user.email);

    const res = await client.post("/api/account/intake", buildValidIntakePayload(), {
      token: session.token,
      skipIdempotency: true,
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.code, "idempotency_key_required");
  });
});

test("POST /api/account/intake replay returns same lead", async () => {
  await withApp(app, async (client) => {
    const session = await registerAndLogin(client, { email: "replay-user@example.com" });
    verifyUserEmail(store, session.user.email);

    const payload = buildValidIntakePayload({ email: session.user.email });
    const key = newIdempotencyKey();
    const headers = withIdempotencyKey({}, key);

    const first = await client.post("/api/account/intake", payload, {
      token: session.token,
      headers,
    });
    const second = await client.post("/api/account/intake", payload, {
      token: session.token,
      headers,
    });

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(second.headers["idempotent-replayed"], "true");
    assert.equal(first.body.lead.id, second.body.lead.id);
    assert.equal(store.leads.size, 1);
  });
});

test("POST /api/account/intake same key different payload conflicts", async () => {
  await withApp(app, async (client) => {
    const session = await registerAndLogin(client, { email: "conflict-user@example.com" });
    verifyUserEmail(store, session.user.email);

    const key = newIdempotencyKey();
    const headers = withIdempotencyKey({}, key);

    const first = await client.post(
      "/api/account/intake",
      buildValidIntakePayload({ email: session.user.email, firstName: "Alpha" }),
      { token: session.token, headers }
    );
    const second = await client.post(
      "/api/account/intake",
      buildValidIntakePayload({ email: session.user.email, firstName: "Beta" }),
      { token: session.token, headers }
    );

    assert.equal(first.status, 201);
    assert.equal(second.status, 409);
    assert.equal(second.body.code, "idempotency_key_conflict");
    assert.equal(store.leads.size, 1);
  });
});

test("idempotency keys are scoped per user", async () => {
  await withApp(app, async (client) => {
    const userA = await registerAndLogin(client, { email: "scope-a@example.com" });
    const userB = await registerAndLogin(client, { email: "scope-b@example.com" });
    verifyUserEmail(store, userA.user.email);
    verifyUserEmail(store, userB.user.email);

    const key = newIdempotencyKey();
    const headers = withIdempotencyKey({}, key);

    const resA = await client.post(
      "/api/account/intake",
      buildValidIntakePayload({ email: userA.user.email }),
      { token: userA.token, headers }
    );
    const resB = await client.post(
      "/api/account/intake",
      buildValidIntakePayload({ email: userB.user.email }),
      { token: userB.token, headers }
    );

    assert.equal(resA.status, 201);
    assert.equal(resB.status, 201);
    assert.notEqual(resA.body.lead.id, resB.body.lead.id);
    assert.equal(store.leads.size, 2);
  });
});

test("POST /api/public/privacy/request replay does not duplicate DSAR", async () => {
  await withApp(app, async (client) => {
    const key = newIdempotencyKey();
    const headers = withIdempotencyKey({}, key);
    const payload = {
      type: "access",
      email: "privacy@example.com",
      message: "Please export my data",
    };

    const first = await client.post("/api/public/privacy/request", payload, { headers });
    const second = await client.post("/api/public/privacy/request", payload, { headers });

    assert.equal(first.status, 201);
    assert.equal(second.status, 201);
    assert.equal(second.headers["idempotent-replayed"], "true");
    assert.equal(first.body.id, second.body.id);
    assert.equal(store.dsarRequests.size, 1);
  });
});
