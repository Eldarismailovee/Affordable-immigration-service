import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../src/utils/appError.js";

function createUserRow(overrides = {}) {
  return {
    id: "user-1",
    email: "user@example.com",
    full_name: "Demo User",
    role: "user",
    status: "active",
    password_hash: "hash",
    email_verified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

async function loadPasswordResetService(t, { userRepo = {}, authTokenRepo = {}, emailService = {} } = {}) {
  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: {
      findUserByEmail: async () => null,
      updateUserPasswordById: async () => null,
      ...userRepo,
    },
  });

  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      consumePasswordResetToken: async () => null,
      createPasswordResetToken: async () => null,
      revokeUserRefreshTokens: async () => null,
      ...authTokenRepo,
    },
  });

  t.mock.module("../../src/services/email.service.js", {
    namedExports: {
      sendPasswordResetEmail: () => {},
      ...emailService,
    },
  });

  return import(`../../src/services/password-reset.service.js?case=${Math.random()}`);
}

function assertAppError(err, { statusCode, code, message }) {
  assert.ok(err instanceof AppError);
  assert.equal(err.name, "AppError");
  assert.equal(err.statusCode, statusCode);
  assert.equal(err.code, code);
  if (message) assert.match(err.message, message);
  return true;
}

test("requestPasswordReset returns a generic message even when no user matches", async (t) => {
  const tokenCalls = [];
  const { requestPasswordReset } = await loadPasswordResetService(t, {
    userRepo: { findUserByEmail: async () => null },
    authTokenRepo: {
      createPasswordResetToken: async (input) => {
        tokenCalls.push(input);
        return null;
      },
    },
  });

  const result = await requestPasswordReset({ email: "no-such@example.com" });
  assert.match(result.message, /If an account exists/);
  assert.equal(tokenCalls.length, 0);
});

test("requestPasswordReset creates a reset token when the user exists", async (t) => {
  const tokenCalls = [];
  const emailCalls = [];
  const { requestPasswordReset } = await loadPasswordResetService(t, {
    userRepo: { findUserByEmail: async () => createUserRow() },
    authTokenRepo: {
      createPasswordResetToken: async (input) => {
        tokenCalls.push(input);
        return null;
      },
    },
    emailService: {
      sendPasswordResetEmail: (email, token) => emailCalls.push({ email, token }),
    },
  });

  const result = await requestPasswordReset({ email: "user@example.com" });
  assert.equal(tokenCalls.length, 1);
  assert.equal(emailCalls.length, 1);
  assert.match(result.message, /If an account exists/);
});

test("confirmPasswordReset rejects when the token cannot be consumed", async (t) => {
  const { confirmPasswordReset } = await loadPasswordResetService(t, {
    authTokenRepo: { consumePasswordResetToken: async () => null },
  });

  await assert.rejects(
    confirmPasswordReset({ token: "x".repeat(48), password: "longenough1" }),
    (err) => {
      return assertAppError(err, {
        statusCode: 400,
        code: "BAD_REQUEST",
        message: /Invalid or expired/,
      });
    }
  );
});

test("confirmPasswordReset updates the password and revokes other sessions", async (t) => {
  const passwordUpdates = [];
  const revocations = [];
  const { confirmPasswordReset } = await loadPasswordResetService(t, {
    userRepo: {
      updateUserPasswordById: async (userId, hash) => {
        passwordUpdates.push({ userId, hash });
        return null;
      },
    },
    authTokenRepo: {
      consumePasswordResetToken: async () => ({ id: "rt-1", user_id: "user-1" }),
      revokeUserRefreshTokens: async (userId) => {
        revocations.push(userId);
        return null;
      },
    },
  });

  const result = await confirmPasswordReset({
    token: "x".repeat(48),
    password: "longenough1",
  });

  assert.equal(passwordUpdates.length, 1);
  assert.equal(passwordUpdates[0].userId, "user-1");
  assert.notEqual(passwordUpdates[0].hash, "longenough1");
  assert.deepEqual(revocations, ["user-1"]);
  assert.match(result.message, /Password updated/);
});
