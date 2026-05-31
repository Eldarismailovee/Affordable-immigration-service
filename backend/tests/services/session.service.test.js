import test from "node:test";
import assert from "node:assert/strict";
import { RefreshTokenRotationError } from "../../src/repositories/auth-token.repository.js";
import { AppError } from "../../src/utils/appError.js";
import { hashToken } from "../../src/utils/auth.js";

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

async function loadSessionService(t, { userRepo = {}, authTokenRepo = {} } = {}) {
  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: {
      findUserById: async () => null,
      ...userRepo,
    },
  });

  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      RefreshTokenRotationError,
      createRefreshToken: async () => null,
      findRefreshTokenByHash: async () => null,
      revokeRefreshTokenByHash: async () => null,
      revokeUserRefreshTokens: async () => null,
      rotateRefreshToken: async () => null,
      ...authTokenRepo,
    },
  });

  t.mock.module("../../src/services/audit.service.js", {
    namedExports: {
      recordAuditEvent: async () => {},
      recordAdminAction: async () => {},
      listAdminAuditEvents: async () => [],
    },
  });

  return import(`../../src/services/session.service.js?case=${Math.random()}`);
}

function assertAppError(err, { statusCode, code, message }) {
  assert.ok(err instanceof AppError);
  assert.equal(err.name, "AppError");
  assert.equal(err.statusCode, statusCode);
  assert.equal(err.code, code);
  if (message) assert.match(err.message, message);
  return true;
}

test("refreshAuthSession rejects an unknown refresh token with 401", async (t) => {
  const { refreshAuthSession } = await loadSessionService(t, {
    authTokenRepo: { findRefreshTokenByHash: async () => null },
  });

  await assert.rejects(refreshAuthSession("any-refresh", {}), (err) =>
    assertAppError(err, {
      statusCode: 401,
      code: "AUTHENTICATION_REQUIRED",
    })
  );
});

test("refreshAuthSession rejects a revoked refresh token with 401 and revokes all user tokens", async (t) => {
  const revokedUsers = [];
  const { refreshAuthSession } = await loadSessionService(t, {
    authTokenRepo: {
      findRefreshTokenByHash: async () => ({
        id: "rt-1",
        user_id: "user-1",
        revoked_at: new Date(),
        expires_at: new Date(Date.now() + 60_000),
      }),
      revokeUserRefreshTokens: async (userId) => {
        revokedUsers.push(userId);
      },
    },
  });

  await assert.rejects(refreshAuthSession("any-refresh", {}), (err) =>
    assertAppError(err, {
      statusCode: 401,
      code: "AUTHENTICATION_REQUIRED",
    })
  );
  assert.deepEqual(revokedUsers, ["user-1"]);
});

test("refreshAuthSession rejects an expired refresh token with 401", async (t) => {
  const { refreshAuthSession } = await loadSessionService(t, {
    authTokenRepo: {
      findRefreshTokenByHash: async () => ({
        id: "rt-1",
        user_id: "user-1",
        revoked_at: null,
        expires_at: new Date(Date.now() - 60_000),
      }),
    },
  });

  await assert.rejects(refreshAuthSession("any-refresh", {}), (err) =>
    assertAppError(err, {
      statusCode: 401,
      code: "AUTHENTICATION_REQUIRED",
    })
  );
});

test("refreshAuthSession rejects concurrent refresh rotation with 401", async (t) => {
  const { refreshAuthSession } = await loadSessionService(t, {
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
      rotateRefreshToken: async () => {
        throw new RefreshTokenRotationError();
      },
    },
  });

  await assert.rejects(refreshAuthSession("any-refresh", {}), (err) =>
    assertAppError(err, {
      statusCode: 401,
      code: "AUTHENTICATION_REQUIRED",
    })
  );
});

test("refreshAuthSession rotates the token and issues a new access token", async (t) => {
  const rotations = [];
  const { refreshAuthSession } = await loadSessionService(t, {
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
  const { logoutUser } = await loadSessionService(t, {
    authTokenRepo: {
      findRefreshTokenByHash: async () => ({
        id: "rt-1",
        user_id: "user-1",
      }),
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
