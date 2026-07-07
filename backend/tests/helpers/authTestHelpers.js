import assert from "node:assert/strict";
import { generate } from "otplib";

export async function registerAndLogin(
  client,
  { email, password = "longenough1", fullName = "Demo" }
) {
  const res = await client.post("/api/auth/register", { fullName, email, password });
  assert.equal(res.status, 201);
  return res.body;
}

export function promoteUserRole(store, email, role) {
  const user = [...store.users.values()].find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    throw new Error(`User not found for role promotion: ${email}`);
  }

  user.role = role;
  return user;
}

export function verifyUserEmail(store, email) {
  const user = [...store.users.values()].find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    throw new Error(`User not found for email verification: ${email}`);
  }

  user.email_verified_at = new Date();
  return user;
}

export async function login(client, { email, password = "longenough1" }) {
  client.clearCookies();
  const res = await client.post("/api/auth/login", { email, password });
  return res;
}

export async function enrollPrivilegedMfa(client, loginBody, { password = "longenough1" } = {}) {
  const challengeToken = loginBody.mfaChallengeToken;
  assert.ok(challengeToken, "expected MFA challenge token");

  const start = await client.post("/api/auth/mfa/enrollment/start", {
    challengeToken,
    password,
  });
  assert.equal(start.status, 200);
  assert.ok(start.body.secret, "test environment should expose enrollment secret");

  const code = await generate({ secret: start.body.secret });
  const confirm = await client.post("/api/auth/mfa/enrollment/confirm", {
    challengeToken,
    code,
  });
  assert.equal(confirm.status, 201);
  assert.ok(confirm.body.token, "enrollment should issue MFA session");
  assert.ok(Array.isArray(confirm.body.recoveryCodes));

  return {
    ...confirm.body,
    mfaSecret: start.body.secret,
  };
}

export async function verifyPrivilegedMfa(client, loginBody, secret) {
  const challengeToken = loginBody.mfaChallengeToken;
  assert.ok(challengeToken);
  const code = await generate({ secret });
  const verify = await client.post("/api/auth/mfa/verify", {
    challengeToken,
    code,
  });
  assert.equal(verify.status, 200);
  assert.ok(verify.body.token);
  return verify.body;
}

export async function loginPrivilegedUser(
  client,
  store,
  { email, password = "longenough1", role = "admin", mfaSecret = null }
) {
  const existing = [...store.users.values()].find(
    (entry) => entry.email.toLowerCase() === email.toLowerCase()
  );

  if (!existing) {
    await registerAndLogin(client, { email, password });
    promoteUserRole(store, email, role);
    verifyUserEmail(store, email);
  }

  const loginRes = await login(client, { email, password });
  assert.equal(loginRes.status, 200);

  if (loginRes.body.mfaEnrollmentRequired) {
    const enrolled = await enrollPrivilegedMfa(client, loginRes.body, { password });
    return enrolled;
  }

  if (loginRes.body.mfaRequired) {
    assert.ok(mfaSecret, "stored MFA secret required for verification");
    return verifyPrivilegedMfa(client, loginRes.body, mfaSecret);
  }

  return loginRes.body;
}

export async function makeAdmin(client, store, email = "admin@example.com") {
  const session = await loginPrivilegedUser(client, store, { email, role: "admin" });
  return session;
}

export async function makeAttorney(client, store, email = "attorney@example.com") {
  const session = await loginPrivilegedUser(client, store, { email, role: "attorney" });
  return session;
}

export async function makeRegularUser(
  client,
  store,
  email = "user@example.com"
) {
  const hasAdmin = [...store.users.values()].some((user) => user.role === "admin");

  if (!hasAdmin) {
    await makeAdmin(client, store, `admin-${email}`);
  }

  const session = await registerAndLogin(client, { email });
  verifyUserEmail(store, email);
  return session;
}

export async function performStepUp(client, { code, recoveryCode } = {}) {
  const payload = code ? { code } : { recoveryCode };
  const res = await client.post("/api/auth/mfa/step-up", payload);
  assert.equal(res.status, 200);
  return res.body;
}
