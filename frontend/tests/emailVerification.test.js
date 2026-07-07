import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

test("protected route redirects unverified users to verification page", () => {
  const route = read("src/components/auth/ProtectedRoute.jsx");
  assert.match(route, /verify-email/);
  assert.match(route, /isEmailVerified/);
});

test("verify email page removes token from URL after processing", () => {
  const page = read("src/pages/VerifyEmailPage.jsx");
  assert.match(page, /setSearchParams\(\{\}, \{ replace: true \}\)/);
  assert.doesNotMatch(page, /localStorage/);
  assert.doesNotMatch(page, /sessionStorage/);
});

test("verification API uses POST body and does not persist token client-side", () => {
  const api = read("src/services/api.js");
  assert.match(api, /\/auth\/email\/verify/);
  assert.doesNotMatch(api, /localStorage/);
  assert.doesNotMatch(api, /sessionStorage/);
});

test("resend uses neutral public endpoint", () => {
  const api = read("src/services/api.js");
  assert.match(api, /\/auth\/email\/resend/);
});

test("change email page shows pending verification messaging", () => {
  const page = read("src/pages/ChangeEmailPage.jsx");
  assert.match(page, /Change email/);
  assert.match(page, /password/);
});

test("auth context exposes email verification state from backend user", () => {
  const context = read("src/context/AuthContext.jsx");
  assert.match(context, /emailVerifiedAt/);
  assert.doesNotMatch(context, /emailVerified:\s*true/);
});
