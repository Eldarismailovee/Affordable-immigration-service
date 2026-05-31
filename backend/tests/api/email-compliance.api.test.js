import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { hashEmail } from "../../src/utils/email.js";
import { createUnsubscribeToken } from "../../src/utils/unsubscribeToken.js";
import { EMAIL_SUPPRESSION_SCOPES } from "../../src/constants/emailCompliance.js";
import { AUDIT_EVENT_TYPES } from "../../src/constants/audit.js";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { withApp } from "../helpers/httpClient.js";

function grantMarketingConsent(store, userId, { newsletter = false } = {}) {
  const user = store.users.get(userId);
  user.marketing_consent = true;
  user.newsletter_consent = newsletter;
  user.marketing_consent_at = new Date();
  user.marketing_consent_source = "test";
}

process.env.MARKETING_PHYSICAL_ADDRESS =
  "123 Compliance Way, Suite 100, Example City, CA 90000";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
});

async function registerUser(client, email = "marketing@example.com") {
  const res = await client.post("/api/auth/register", {
    fullName: "Marketing User",
    email,
    password: "SecurePass123!",
  });
  return res.body;
}

test("POST /api/public/unsubscribe creates suppression row", async () => {
  const token = await createUnsubscribeToken({
    email: "unsub@example.com",
    scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
  });

  await withApp(app, async (client) => {
    const res = await client.post("/api/public/unsubscribe", {
      token,
      scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    const key = `${hashEmail("unsub@example.com")}:${EMAIL_SUPPRESSION_SCOPES.MARKETING}`;
    assert.ok(store.emailSuppressions.get(key));
    assert.equal(
      store.auditEvents.some((e) => e.event_type === AUDIT_EVENT_TYPES.EMAIL_UNSUBSCRIBE_CREATED),
      true
    );
  });
});

test("unsubscribe is idempotent", async () => {
  const token = await createUnsubscribeToken({
    email: "again@example.com",
    scope: EMAIL_SUPPRESSION_SCOPES.MARKETING,
  });

  await withApp(app, async (client) => {
    const first = await client.post("/api/public/unsubscribe", { token });
    const second = await client.post("/api/public/unsubscribe", { token });
    assert.equal(first.status, 200);
    assert.equal(second.status, 200);
    const rows = Array.from(store.emailSuppressions.values()).filter(
      (row) => row.email_hash === hashEmail("again@example.com")
    );
    assert.equal(rows.length, 1);
  });
});

test("opt-out updates user consent flags", async () => {
  await withApp(app, async (client) => {
    await registerUser(client, "optout@example.com");
    const user = Array.from(store.users.values()).find(
      (row) => row.email === "optout@example.com"
    );
    grantMarketingConsent(store, user.id, { newsletter: true });

    const token = await createUnsubscribeToken({
      email: user.email,
      scope: EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL,
    });
    await client.post("/api/public/unsubscribe", {
      token,
      scope: EMAIL_SUPPRESSION_SCOPES.ALL_NON_TRANSACTIONAL,
    });

    const updated = store.users.get(user.id);
    assert.equal(updated.marketing_consent, false);
    assert.equal(updated.newsletter_consent, false);
    assert.ok(updated.marketing_opt_out_at);
  });
});

test("PATCH /api/account/email-preferences withdraws marketing consent", async () => {
  await withApp(app, async (client) => {
    const auth = await registerUser(client, "prefs@example.com");
    const user = store.users.get(auth.user.id);
    grantMarketingConsent(store, user.id);

    const res = await client.patch(
      "/api/account/email-preferences",
      { marketingConsent: false },
      { token: auth.token }
    );

    assert.equal(res.status, 200);
    assert.equal(res.body.user.marketingConsent, false);
    const key = `${hashEmail(user.email)}:${EMAIL_SUPPRESSION_SCOPES.MARKETING}`;
    assert.ok(store.emailSuppressions.get(key));
  });
});

test("newsletter signup schema requires explicit marketingConsent true", async () => {
  const { newsletterSignupSchema } = await import(
    "../../src/schemas/email-compliance.schema.js"
  );

  assert.throws(() =>
    newsletterSignupSchema.parse({
      email: "a@b.com",
      marketingConsent: false,
    })
  );
  const parsed = newsletterSignupSchema.parse({
    email: "a@b.com",
    marketingConsent: true,
  });
  assert.equal(parsed.marketingConsent, true);
});
