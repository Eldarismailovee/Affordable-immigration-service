import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("login page routes MFA challenge to verify or enrollment", () => {
  const login = read("src/pages/LoginPage.jsx");
  assert.match(login, /mfaPending/);
  assert.match(login, /\/mfa\/verify/);
  assert.match(login, /\/mfa\/enroll/);
});

test("protected route blocks privileged UI without token", () => {
  const route = read("src/components/auth/ProtectedRoute.jsx");
  assert.match(route, /hasToken/);
  assert.match(route, /\/mfa\/verify/);
});

test("auth context does not persist MFA secrets to localStorage", () => {
  const context = read("src/context/AuthContext.jsx");
  assert.doesNotMatch(context, /localStorage/);
  const api = read("src/services/api.js");
  assert.doesNotMatch(api, /localStorage/);
});

test("enrollment page shows recovery codes once with acknowledgement", () => {
  const page = read("src/pages/MfaEnrollmentPage.jsx");
  assert.match(page, /recoveryCodes/);
  assert.match(page, /shown once/i);
  assert.match(page, /acknowledgeRecoveryCodes/);
});

test("MFA verify page supports recovery code path", () => {
  const page = read("src/pages/MfaVerifyPage.jsx");
  assert.match(page, /recoveryCode/);
  assert.match(page, /completeMfaVerify/);
});
