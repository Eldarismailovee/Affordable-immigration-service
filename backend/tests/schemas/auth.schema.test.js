import test from "node:test";
import assert from "node:assert/strict";
import {
  confirmEmailVerificationSchema,
  confirmPasswordResetSchema,
  loginSchema,
  registerSchema,
  requestPasswordResetSchema,
} from "../../src/schemas/auth.schema.js";
import {
  readCookie,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../../src/utils/authCookies.js";

const validRegister = {
  fullName: "Arina Demo",
  email: "user@example.com",
  password: "longenoughpassword",
};

test("registerSchema accepts a valid payload", () => {
  const result = registerSchema.safeParse(validRegister);
  assert.equal(result.success, true);
});

test("registerSchema rejects empty full name", () => {
  const result = registerSchema.safeParse({ ...validRegister, fullName: "   " });
  assert.equal(result.success, false);
});

test("registerSchema rejects invalid email", () => {
  const result = registerSchema.safeParse({ ...validRegister, email: "not-an-email" });
  assert.equal(result.success, false);
});

test("registerSchema rejects privileged role fields", () => {
  assert.equal(registerSchema.safeParse({ ...validRegister, role: "admin" }).success, false);
  assert.equal(registerSchema.safeParse({ ...validRegister, role: "attorney" }).success, false);
});

test("registerSchema rejects nested privileged role fields", () => {
  assert.equal(
    registerSchema.safeParse({ ...validRegister, profile: { role: "admin" } }).success,
    false
  );
});

test("registerSchema rejects short password", () => {
  const result = registerSchema.safeParse({ ...validRegister, password: "short1" });
  assert.equal(result.success, false);
  assert.match(result.error.issues[0].message, /at least 8/);
});

test("loginSchema accepts a valid payload", () => {
  const result = loginSchema.safeParse({
    email: "user@example.com",
    password: "anything",
  });
  assert.equal(result.success, true);
});

test("loginSchema rejects empty password", () => {
  const result = loginSchema.safeParse({
    email: "user@example.com",
    password: "",
  });
  assert.equal(result.success, false);
});

test("requestPasswordResetSchema rejects bad email", () => {
  const result = requestPasswordResetSchema.safeParse({ email: "nope" });
  assert.equal(result.success, false);
});

test("confirmPasswordResetSchema requires both token and password", () => {
  const okPayload = {
    token: "a".repeat(48),
    password: "longenoughpassword",
  };
  assert.equal(confirmPasswordResetSchema.safeParse(okPayload).success, true);

  assert.equal(
    confirmPasswordResetSchema.safeParse({ ...okPayload, token: "short" }).success,
    false
  );

  assert.equal(
    confirmPasswordResetSchema.safeParse({ ...okPayload, password: "short" }).success,
    false
  );
});

test("confirmEmailVerificationSchema requires a long enough token", () => {
  assert.equal(
    confirmEmailVerificationSchema.safeParse({ token: "short" }).success,
    false
  );
  assert.equal(
    confirmEmailVerificationSchema.safeParse({ token: "a".repeat(48) }).success,
    true
  );
});

test("readCookie parses a single cookie value", () => {
  const req = {
    headers: {
      cookie: `${REFRESH_TOKEN_COOKIE_NAME}=abc123; other=value`,
    },
  };

  assert.equal(readCookie(req, REFRESH_TOKEN_COOKIE_NAME), "abc123");
  assert.equal(readCookie(req, "other"), "value");
  assert.equal(readCookie(req, "missing"), undefined);
});

test("readCookie decodes URI-encoded values", () => {
  const req = {
    headers: {
      cookie: "token=hello%20world",
    },
  };

  assert.equal(readCookie(req, "token"), "hello world");
});

test("readCookie returns undefined when cookie header is missing", () => {
  assert.equal(readCookie({ headers: {} }, "token"), undefined);
});
