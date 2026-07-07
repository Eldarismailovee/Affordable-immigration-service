import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../src/utils/appError.js";

async function loadEmailVerificationService(t, overrides = {}) {
  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: {
      markUserEmailVerifiedById: async (userId) => ({ id: userId, email_verified_at: new Date() }),
      findUserById: async () => ({ id: "user-1", status: "active", email: "demo@example.com" }),
      promotePendingEmailById: async () => null,
      findUserByEmail: async () => null,
      ...overrides.userRepo,
    },
  });

  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      consumeEmailVerificationToken: async () => null,
      invalidateEmailVerificationTokensForUser: async () => {},
      revokeUserRefreshTokens: async () => {},
      countRecentEmailVerificationSends: async () => 0,
      ...overrides.authTokenRepo,
    },
  });

  t.mock.module("../../src/services/session.service.js", {
    namedExports: {
      createAuthSession: async () => ({
        user: { id: "user-1", emailVerifiedAt: new Date() },
        token: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 900,
      }),
    },
  });

  t.mock.module("../../src/services/email-verification-delivery.js", {
    namedExports: {
      issueVerificationTokenForChange: async () => ({ verificationToken: "x".repeat(48) }),
      deliverVerificationEmail: async () => ({ deliveryStatus: "sent", message: "sent" }),
    },
  });

  t.mock.module("../../src/db/transaction.js", {
    namedExports: {
      withTransaction: async (callback) => callback({}),
    },
  });

  t.mock.module("../../src/db/pool.js", {
    defaultExport: {},
  });

  t.mock.module("../../src/services/audit.service.js", {
    namedExports: {
      recordAuditEvent: async () => {},
    },
  });

  return import(`../../src/services/email-verification.service.js?case=${Math.random()}`);
}

test("confirmEmailVerification marks the user as verified when the token is valid", async (t) => {
  const verifications = [];
  const { confirmEmailVerification } = await loadEmailVerificationService(t, {
    userRepo: {
      markUserEmailVerifiedById: async (userId) => {
        verifications.push(userId);
        return { id: userId, email_verified_at: new Date() };
      },
    },
    authTokenRepo: {
      consumeEmailVerificationToken: async () => ({
        user_id: "user-1",
        email: "demo@example.com",
        purpose: "registration",
      }),
    },
  });

  const result = await confirmEmailVerification("x".repeat(48));
  assert.deepEqual(verifications, ["user-1"]);
  assert.match(result.message, /Email verified/);
  assert.equal(result.token, "access-token");
});

test("confirmEmailVerification rejects an invalid token with 400", async (t) => {
  const { confirmEmailVerification } = await loadEmailVerificationService(t);

  await assert.rejects(confirmEmailVerification("bad"), (err) => {
    assert.ok(err instanceof AppError);
    assert.equal(err.code, "invalid_verification_token");
    return true;
  });
});
