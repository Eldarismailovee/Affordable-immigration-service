import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { withApp } from "../helpers/httpClient.js";
import {
  makeRegularUser,
  promoteUserRole,
  verifyUserEmail,
} from "../helpers/authTestHelpers.js";

let app;
let store;
let getLastVerificationToken = () => null;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
  ({ __testGetLastVerificationToken: getLastVerificationToken } = await import(
    "../../src/services/email-verification-delivery.js"
  ));
});

beforeEach(() => {
  clearStore(store);
});

function getVerificationToken() {
  return getLastVerificationToken();
}

test("registration creates unverified user and rejects emailVerified in request body", async () => {
  await withApp(app, async (client) => {
    const rejected = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
      emailVerified: true,
      email_verified_at: new Date().toISOString(),
    });

    assert.equal(rejected.status, 400);

    const res = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.emailVerifiedAt, null);

    const user = [...store.users.values()][0];
    assert.equal(user.email_verified_at, null);
    assert.ok(store.emailVerificationTokens.size >= 1);

    for (const row of store.emailVerificationTokens.values()) {
      assert.notEqual(row.token_hash, row.id);
      assert.match(row.token_hash, /^[a-f0-9]{64}$/);
    }
  });
});

test("unverified user is blocked from sensitive account intake endpoint", async () => {
  await withApp(app, async (client) => {
    const register = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    });

    const res = await client.post(
      "/api/account/intake",
      {
        packageId: "basic",
        client: { fullName: "Demo", email: "demo@example.com", phone: "555-0100" },
        case: { matterType: "family", jurisdiction: "CA" },
      },
      { token: register.body.token }
    );

    assert.equal(res.status, 403);
    assert.equal(res.body.code, "email_verification_required");
  });
});

test("verified user can access sensitive account endpoint after token confirmation", async () => {
  await withApp(app, async (client) => {
    const register = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "verified@example.com",
      password: "longenough1",
    });

    const token = getVerificationToken();
    assert.ok(token, "expected test verification token");

    const verify = await client.post("/api/auth/email/verify", { token });
    assert.equal(verify.status, 200);
    assert.ok(verify.body.token);
    assert.ok(verify.body.user.emailVerifiedAt);

    const leads = await client.get("/api/account/leads", { token: verify.body.token });
    assert.equal(leads.status, 200);
  });
});

test("public resend response is neutral for unknown and verified accounts", async () => {
  await withApp(app, async (client) => {
    const unknown = await client.post("/api/auth/email/resend", {
      email: "missing@example.com",
    });
    assert.equal(unknown.status, 200);
    assert.match(unknown.body.message, /If an account exists/i);

    await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "verified@example.com",
      password: "longenough1",
    });
    verifyUserEmail(store, "verified@example.com");

    const verified = await client.post("/api/auth/email/resend", {
      email: "verified@example.com",
    });
    assert.equal(verified.status, 200);
    assert.match(verified.body.message, /If an account exists/i);
  });
});

test("privileged login requires verified email before MFA", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Admin",
      email: "admin@example.com",
      password: "longenough1",
    });
    promoteUserRole(store, "admin@example.com", "admin");

    const login = await client.post("/api/auth/login", {
      email: "admin@example.com",
      password: "longenough1",
    });

    assert.equal(login.status, 403);
    assert.equal(login.body.code, "email_verification_required");
  });
});

test("email change keeps pending email until verification", async () => {
  await withApp(app, async (client) => {
    const session = await makeRegularUser(client, store, "user@example.com");

    const change = await client.post(
      "/api/auth/email/change",
      {
        email: "new@example.com",
        password: "longenough1",
      },
      { token: session.token }
    );

    assert.equal(change.status, 200);
    assert.equal(change.body.pendingEmail, "new@example.com");

    const user = [...store.users.values()].find((entry) => entry.email === "user@example.com");
    assert.equal(user.pending_email, "new@example.com");
    assert.equal(user.email_verified_at, null);
  });
});

test("password reset token cannot verify email automatically", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    });

    const reset = await client.post("/api/auth/password-reset/request", {
      email: "demo@example.com",
    });
    assert.equal(reset.status, 200);

    const resetToken = reset.body.debugToken;
    assert.ok(resetToken);

    const verify = await client.post("/api/auth/email/verify", { token: resetToken });
    assert.equal(verify.status, 400);

    const user = [...store.users.values()][0];
    assert.equal(user.email_verified_at, null);
  });
});

test("verification audit events do not store token material", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    });

    const token = getVerificationToken();
    assert.ok(token);
    await client.post("/api/auth/email/verify", { token });

    for (const event of store.auditEvents) {
      const serialized = JSON.stringify(event);
      assert.ok(!serialized.includes(token));
    }
  });
});
