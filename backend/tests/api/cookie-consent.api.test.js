import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { COOKIE_CONSENT_VERSION } from "../../src/constants/cookie-consent.js";
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

const basePayload = {
  consentVersion: COOKIE_CONSENT_VERSION,
  strictlyNecessary: true,
  analytics: false,
  marketing: false,
  source: "banner",
  anonymousId: randomUUID(),
};

test("POST /api/public/cookie-consent logs anonymous consent without login", async () => {
  await withApp(app, async (client) => {
    const res = await client.post("/api/public/cookie-consent", basePayload);

    assert.equal(res.status, 201);
    assert.equal(res.body.ok, true);
    assert.ok(res.body.id);
    assert.equal(store.cookieConsentLogs.length, 1);
    assert.equal(store.cookieConsentLogs[0].user_id, null);
    assert.equal(store.cookieConsentLogs[0].anonymous_id, basePayload.anonymousId);
    assert.equal(store.cookieConsentLogs[0].analytics, false);
    assert.equal(store.cookieConsentLogs[0].marketing, false);
  });
});

test("POST /api/public/cookie-consent rejects strictlyNecessary=false", async () => {
  await withApp(app, async (client) => {
    const res = await client.post("/api/public/cookie-consent", {
      ...basePayload,
      strictlyNecessary: false,
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.equal(store.cookieConsentLogs.length, 0);
  });
});

test("POST /api/public/cookie-consent associates user_id when authenticated", async () => {
  await withApp(app, async (client) => {
    const register = await client.post("/api/auth/register", {
      fullName: "Consent User",
      email: "consent@example.com",
      password: "longenough1",
    });

    const res = await client.post(
      "/api/public/cookie-consent",
      {
        ...basePayload,
        analytics: true,
        marketing: true,
        source: "preferences",
      },
      { token: register.body.token }
    );

    assert.equal(res.status, 201);
    assert.equal(store.cookieConsentLogs.length, 1);
    assert.equal(store.cookieConsentLogs[0].user_id, register.body.user.id);
    assert.equal(store.cookieConsentLogs[0].analytics, true);
    assert.equal(store.cookieConsentLogs[0].marketing, true);
    assert.equal(store.cookieConsentLogs[0].source, "preferences");
  });
});

test("POST /api/public/cookie-consent stores hashed request metadata", async () => {
  await withApp(app, async (client) => {
    const res = await client.post("/api/public/cookie-consent", basePayload);

    assert.equal(res.status, 201);
    assert.ok(store.cookieConsentLogs[0].user_agent_hash);
    assert.ok(store.cookieConsentLogs[0].ip_hash);
  });
});
