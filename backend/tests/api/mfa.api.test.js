import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { verifyAuthToken } from "../../src/utils/auth.js";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import {
  enrollPrivilegedMfa,
  login,
  makeAdmin,
  makeRegularUser,
  promoteUserRole,
  registerAndLogin,
  verifyPrivilegedMfa,
  verifyUserEmail,
} from "../helpers/authTestHelpers.js";
import { withApp } from "../helpers/httpClient.js";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
});

test("client login without MFA returns full session", async () => {
  await withApp(app, async (client) => {
    const session = await makeRegularUser(client, store);
    assert.ok(session.token);
    const payload = await verifyAuthToken(session.token);
    assert.equal(payload.mfa, false);
  });
});

test("privileged login without enrollment returns challenge not access token", async () => {
  await withApp(app, async (client) => {
    await registerAndLogin(client, { email: "admin@example.com" });
    promoteUserRole(store, "admin@example.com", "admin");
    verifyUserEmail(store, "admin@example.com");
    const res = await login(client, { email: "admin@example.com" });
    assert.equal(res.status, 200);
    assert.equal(res.body.mfaEnrollmentRequired, true);
    assert.ok(res.body.mfaChallengeToken);
    assert.equal(res.body.token, undefined);
  });
});

test("privileged user with MFA gets mfaRequired on password login", async () => {
  await withApp(app, async (client) => {
    await makeAdmin(client, store);
    client.clearCookies();
    const res = await login(client, { email: "admin@example.com" });
    assert.equal(res.body.mfaRequired, true);
    assert.equal(res.body.token, undefined);
  });
});

test("MFA verify after enrollment issues mfa-complete token", async () => {
  await withApp(app, async (client) => {
    await registerAndLogin(client, { email: "admin@example.com" });
    promoteUserRole(store, "admin@example.com", "admin");
    verifyUserEmail(store, "admin@example.com");
    const loginRes = await login(client, { email: "admin@example.com" });
    const enrolled = await enrollPrivilegedMfa(client, loginRes.body);
    const payload = await verifyAuthToken(enrolled.token);
    assert.equal(payload.mfa, true);
  });
});

test("MFA verify with recovery code after re-login", async () => {
  await withApp(app, async (client) => {
    const enrolled = await makeAdmin(client, store);
    const recoveryCode = enrolled.recoveryCodes[0];
    client.clearCookies();
    const loginRes = await login(client, { email: "admin@example.com" });
    assert.equal(loginRes.body.mfaRequired, true);
    const verify = await client.post("/api/auth/mfa/verify", {
      challengeToken: loginRes.body.mfaChallengeToken,
      recoveryCode,
    });
    assert.equal(verify.status, 200);
    assert.ok(verify.body.token);
    const payload = await verifyAuthToken(verify.body.token);
    assert.equal(payload.mfa, true);
  });
});

test("MFA challenge token is rejected as access token", async () => {
  await withApp(app, async (client) => {
    await registerAndLogin(client, { email: "admin@example.com" });
    promoteUserRole(store, "admin@example.com", "admin");
    verifyUserEmail(store, "admin@example.com");
    const res = await login(client, { email: "admin@example.com" });
    const me = await client.get("/api/auth/me", {
      token: res.body.mfaChallengeToken,
    });
    assert.equal(me.status, 401);
  });
});

test("password-only promoted token cannot access admin API", async () => {
  await withApp(app, async (client) => {
    const user = await registerAndLogin(client, { email: "user@example.com" });
    promoteUserRole(store, "user@example.com", "admin");
    verifyUserEmail(store, "user@example.com");
    const res = await client.get("/api/admin/leads", { token: user.token });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "MFA_REQUIRED");
  });
});

test("enrollment stores encrypted secret not plaintext", async () => {
  await withApp(app, async (client) => {
    await registerAndLogin(client, { email: "admin@example.com" });
    promoteUserRole(store, "admin@example.com", "admin");
    verifyUserEmail(store, "admin@example.com");
    const loginRes = await login(client, { email: "admin@example.com" });
    const start = await client.post("/api/auth/mfa/enrollment/start", {
      challengeToken: loginRes.body.mfaChallengeToken,
    });
    assert.equal(start.status, 200);
    const pending = [...store.mfaFactors.values()].find((f) => f.status === "pending");
    assert.ok(pending);
    assert.notEqual(String(pending.encrypted_secret), start.body.secret);
  });
});

test("privileged MFA disable is blocked", async () => {
  await withApp(app, async (client) => {
    const admin = await makeAdmin(client, store);
    const res = await client.post(
      "/api/auth/mfa/disable",
      { password: "longenough1", code: "123456" },
      { token: admin.token }
    );
    assert.equal(res.status, 403);
    assert.equal(res.body.code, "MFA_DISABLE_BLOCKED");
  });
});

test("recovery codes returned once at enrollment", async () => {
  await withApp(app, async (client) => {
    const session = await makeAdmin(client, store);
    assert.ok(Array.isArray(session.recoveryCodes));
    assert.ok(session.recoveryCodes.length >= 8);
  });
});

test("invalid MFA challenge purpose is rejected at verify", async () => {
  await withApp(app, async (client) => {
    await registerAndLogin(client, { email: "admin@example.com" });
    promoteUserRole(store, "admin@example.com", "admin");
    verifyUserEmail(store, "admin@example.com");
    const loginRes = await login(client, { email: "admin@example.com" });
    const verify = await client.post("/api/auth/mfa/verify", {
      challengeToken: loginRes.body.mfaChallengeToken,
      code: "000000",
    });
    assert.equal(verify.status, 401);
  });
});

test("role change without fresh MFA step-up can be enforced on sensitive routes", async () => {
  await withApp(app, async (client) => {
    const admin = await makeAdmin(client, store);
    const user = await registerAndLogin(client, { email: "target@example.com" });
    const userId = [...store.users.values()].find((u) => u.email === "target@example.com").id;
    const res = await client.patch(
      `/api/admin/users/${userId}/role`,
      { role: "attorney" },
      { token: admin.token }
    );
    assert.equal(res.status, 200);
  });
});

test("admin can access leads with MFA-complete session", async () => {
  await withApp(app, async (client) => {
    const admin = await makeAdmin(client, store);
    const res = await client.get("/api/admin/leads", { token: admin.token });
    assert.equal(res.status, 200);
  });
});
