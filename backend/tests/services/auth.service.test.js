import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, hashToken, verifyAuthToken } from "../../src/utils/auth.js";

function createUserRow(overrides = {}) {
  return {
    id: "user-1",
    email: "user@example.com",
    full_name: "Demo User",
    role: "user",
    status: "active",
    password_hash: "to-be-overridden",
    email_verified_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

async function loadAuthService(t, { userRepo = {}, authTokenRepo = {}, emailService = {} } = {}) {
  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: {
      countUsers: async () => 1,
      createUser: async () => null,
      findUserByEmail: async () => null,
      findUserById: async () => null,
      markUserEmailVerifiedById: async () => null,
      updateUserPasswordById: async () => null,
      ...userRepo,
    },
  });

  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      consumeEmailVerificationToken: async () => null,
      consumePasswordResetToken: async () => null,
      createEmailVerificationToken: async () => null,
      createPasswordResetToken: async () => null,
      createRefreshToken: async () => null,
      findRefreshTokenByHash: async () => null,
      revokeRefreshTokenByHash: async () => null,
      revokeUserRefreshTokens: async () => null,
      rotateRefreshToken: async () => null,
      ...authTokenRepo,
    },
  });

  t.mock.module("../../src/services/email.service.js", {
    namedExports: {
      sendEmailVerificationEmail: () => {},
      sendPasswordResetEmail: () => {},
      ...emailService,
    },
  });

  return import(`../../src/services/auth.service.js?case=${Math.random()}`);
}

test("registerUser rejects when an account with the email already exists", async (t) => {
  const { registerUser } = await loadAuthService(t, {
    userRepo: {
      findUserByEmail: async () => createUserRow(),
    },
  });

  await assert.rejects(
    registerUser(
      { fullName: "Demo", email: "user@example.com", password: "longenough1" },
      {}
    ),
    (err) => {
      assert.equal(err.statusCode, 409);
      assert.match(err.message, /already exists/);
      return true;
    }
  );
});

test("registerUser creates a user, issues a session and a verification token, and lowercases email", async (t) => {
  const created = [];
  const verificationCalls = [];
  const refreshTokenCalls = [];

  const { registerUser } = await loadAuthService(t, {
    userRepo: {
      countUsers: async () => 1,
      findUserByEmail: async () => null,
      createUser: async (input) => {
        created.push(input);
        return createUserRow({
          email: input.email,
          full_name: input.fullName,
          role: input.role,
        });
      },
    },
    authTokenRepo: {
      createRefreshToken: async (input) => {
        refreshTokenCalls.push(input);
        return null;
      },
      createEmailVerificationToken: async (input) => {
        verificationCalls.push(input);
        return null;
      },
    },
  });

  const result = await registerUser(
    { fullName: "Demo", email: "USER@example.com", password: "longenough1" },
    { userAgent: "agent", ipAddress: "1.2.3.4" }
  );

  assert.equal(created.length, 1);
  assert.equal(created[0].email, "user@example.com");
  assert.equal(created[0].role, "user");
  assert.notEqual(created[0].passwordHash, "longenough1");

  assert.equal(refreshTokenCalls.length, 1);
  assert.equal(refreshTokenCalls[0].userAgent, "agent");
  assert.equal(refreshTokenCalls[0].ipAddress, "1.2.3.4");

  assert.equal(verificationCalls.length, 1);

  const tokenPayload = await verifyAuthToken(result.token);
  assert.equal(tokenPayload.role, "user");
  assert.ok(typeof result.refreshToken === "string" && result.refreshToken.length > 32);
  assert.ok(result.expiresIn > 0);
  assert.ok(!("password_hash" in result.user));
});

test("registerUser assigns the admin role to the very first user", async (t) => {
  const created = [];
  const { registerUser } = await loadAuthService(t, {
    userRepo: {
      countUsers: async () => 0,
      findUserByEmail: async () => null,
      createUser: async (input) => {
        created.push(input);
        return createUserRow({
          email: input.email,
          full_name: input.fullName,
          role: input.role,
        });
      },
    },
  });

  await registerUser(
    { fullName: "Demo", email: "first@example.com", password: "longenough1" },
    {}
  );

  assert.equal(created[0].role, "admin");
});

test("loginUser rejects an unknown email with 401 (no user enumeration)", async (t) => {
  const { loginUser } = await loadAuthService(t, {
    userRepo: { findUserByEmail: async () => null },
  });

  await assert.rejects(
    loginUser({ email: "nope@example.com", password: "anything" }, {}),
    (err) => {
      assert.equal(err.statusCode, 401);
      assert.match(err.message, /Invalid email or password/);
      return true;
    }
  );
});

test("loginUser rejects a disabled user with 401", async (t) => {
  const passwordHash = await hashPassword("correct-password");
  const { loginUser } = await loadAuthService(t, {
    userRepo: {
      findUserByEmail: async () =>
        createUserRow({ status: "disabled", password_hash: passwordHash }),
    },
  });

  await assert.rejects(
    loginUser({ email: "user@example.com", password: "correct-password" }, {}),
    (err) => {
      assert.equal(err.statusCode, 401);
      return true;
    }
  );
});

test("loginUser rejects a wrong password with 401", async (t) => {
  const passwordHash = await hashPassword("correct-password");
  const { loginUser } = await loadAuthService(t, {
    userRepo: {
      findUserByEmail: async () => createUserRow({ password_hash: passwordHash }),
    },
  });

  await assert.rejects(
    loginUser({ email: "user@example.com", password: "wrong-password" }, {}),
    (err) => {
      assert.equal(err.statusCode, 401);
      return true;
    }
  );
});

test("loginUser issues a session for valid credentials", async (t) => {
  const passwordHash = await hashPassword("correct-password");
  const refreshTokenCalls = [];
  const { loginUser } = await loadAuthService(t, {
    userRepo: {
      findUserByEmail: async () =>
        createUserRow({ password_hash: passwordHash, role: "user" }),
    },
    authTokenRepo: {
      createRefreshToken: async (input) => {
        refreshTokenCalls.push(input);
        return null;
      },
    },
  });

  const result = await loginUser(
    { email: "user@example.com", password: "correct-password" },
    { userAgent: "ua", ipAddress: "ip" }
  );

  assert.equal(refreshTokenCalls.length, 1);
  assert.equal(refreshTokenCalls[0].userAgent, "ua");
  assert.equal(refreshTokenCalls[0].ipAddress, "ip");
  assert.ok(result.token);
  assert.ok(result.refreshToken);
  assert.ok(!("password_hash" in result.user));
});

test("getUserFromAccessToken returns null for an empty/invalid token", async (t) => {
  const { getUserFromAccessToken } = await loadAuthService(t);

  assert.equal(await getUserFromAccessToken(""), null);
  assert.equal(await getUserFromAccessToken("garbage"), null);
});

test("getUserFromAccessToken returns null when the user has been disabled", async (t) => {
  const { default: env } = await import("../../src/config/env.js");
  void env;
  const { SignJWT } = await import("jose");

  const token = await new SignJWT({ typ: "access", role: "user" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject("user-1")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode("development-auth-secret-change-me"));

  const { getUserFromAccessToken } = await loadAuthService(t, {
    userRepo: {
      findUserById: async () => createUserRow({ status: "disabled" }),
    },
  });

  assert.equal(await getUserFromAccessToken(token), null);
});

test("refreshAuthSession rejects an unknown refresh token with 401", async (t) => {
  const { refreshAuthSession } = await loadAuthService(t, {
    authTokenRepo: { findRefreshTokenByHash: async () => null },
  });

  await assert.rejects(refreshAuthSession("any-refresh", {}), (err) => {
    assert.equal(err.statusCode, 401);
    return true;
  });
});

test("refreshAuthSession rejects a revoked refresh token with 401", async (t) => {
  const { refreshAuthSession } = await loadAuthService(t, {
    authTokenRepo: {
      findRefreshTokenByHash: async () => ({
        id: "rt-1",
        user_id: "user-1",
        revoked_at: new Date(),
        expires_at: new Date(Date.now() + 60_000),
      }),
    },
  });

  await assert.rejects(refreshAuthSession("any-refresh", {}), (err) => {
    assert.equal(err.statusCode, 401);
    return true;
  });
});

test("refreshAuthSession rejects an expired refresh token with 401", async (t) => {
  const { refreshAuthSession } = await loadAuthService(t, {
    authTokenRepo: {
      findRefreshTokenByHash: async () => ({
        id: "rt-1",
        user_id: "user-1",
        revoked_at: null,
        expires_at: new Date(Date.now() - 60_000),
      }),
    },
  });

  await assert.rejects(refreshAuthSession("any-refresh", {}), (err) => {
    assert.equal(err.statusCode, 401);
    return true;
  });
});

test("refreshAuthSession rotates the token and issues a new access token", async (t) => {
  const rotations = [];
  const { refreshAuthSession } = await loadAuthService(t, {
    userRepo: {
      findUserById: async () => createUserRow(),
    },
    authTokenRepo: {
      findRefreshTokenByHash: async () => ({
        id: "rt-1",
        user_id: "user-1",
        revoked_at: null,
        expires_at: new Date(Date.now() + 60_000),
      }),
      rotateRefreshToken: async (input) => {
        rotations.push(input);
        return null;
      },
    },
  });

  const result = await refreshAuthSession("any-refresh", { userAgent: "ua", ipAddress: "ip" });

  assert.equal(rotations.length, 1);
  assert.equal(rotations[0].currentTokenId, "rt-1");
  assert.notEqual(rotations[0].nextTokenId, "rt-1");
  assert.ok(result.token);
  assert.notEqual(result.refreshToken, "any-refresh");
});

test("logoutUser revokes the supplied refresh token by hash", async (t) => {
  const calls = [];
  const { logoutUser } = await loadAuthService(t, {
    authTokenRepo: {
      revokeRefreshTokenByHash: async (hash) => {
        calls.push(hash);
        return null;
      },
    },
  });

  const result = await logoutUser("rt-secret");
  assert.equal(calls.length, 1);
  assert.equal(calls[0], hashToken("rt-secret"));
  assert.match(result.message, /Signed out/);
});

test("requestPasswordReset returns a generic message even when no user matches", async (t) => {
  const tokenCalls = [];
  const { requestPasswordReset } = await loadAuthService(t, {
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
  const { requestPasswordReset } = await loadAuthService(t, {
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
  const { confirmPasswordReset } = await loadAuthService(t, {
    authTokenRepo: { consumePasswordResetToken: async () => null },
  });

  await assert.rejects(
    confirmPasswordReset({ token: "x".repeat(48), password: "longenough1" }),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /Invalid or expired/);
      return true;
    }
  );
});

test("confirmPasswordReset updates the password and revokes other sessions", async (t) => {
  const passwordUpdates = [];
  const revocations = [];
  const { confirmPasswordReset } = await loadAuthService(t, {
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

test("confirmEmailVerification marks the user as verified when the token is valid", async (t) => {
  const verifications = [];
  const { confirmEmailVerification } = await loadAuthService(t, {
    userRepo: {
      markUserEmailVerifiedById: async (userId) => {
        verifications.push(userId);
        return null;
      },
    },
    authTokenRepo: {
      consumeEmailVerificationToken: async () => ({ user_id: "user-1" }),
    },
  });

  const result = await confirmEmailVerification("x".repeat(48));
  assert.deepEqual(verifications, ["user-1"]);
  assert.match(result.message, /Email verified/);
});

test("confirmEmailVerification rejects an invalid token with 400", async (t) => {
  const { confirmEmailVerification } = await loadAuthService(t, {
    authTokenRepo: { consumeEmailVerificationToken: async () => null },
  });

  await assert.rejects(confirmEmailVerification("bad"), (err) => {
    assert.equal(err.statusCode, 400);
    return true;
  });
});
