import test from "node:test";
import assert from "node:assert/strict";
import { AppError } from "../../src/utils/appError.js";
import { hashPassword } from "../../src/utils/auth.js";

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

async function loadAuthService(t, { userRepo = {}, authTokenRepo = {}, emailService = {}, sessionService = {} } = {}) {
  const sessionCalls = [];

  t.mock.module("../../src/repositories/user.repository.js", {
    namedExports: {
      countUsers: async () => 1,
      createUser: async () => null,
      findUserByEmail: async () => null,
      findUserById: async () => null,
      ...userRepo,
    },
  });

  t.mock.module("../../src/repositories/auth-token.repository.js", {
    namedExports: {
      createEmailVerificationToken: async () => null,
      ...authTokenRepo,
    },
  });

  t.mock.module("../../src/services/email.service.js", {
    namedExports: {
      sendEmailVerificationEmail: () => {},
      ...emailService,
    },
  });

  t.mock.module("../../src/services/session.service.js", {
    namedExports: {
      createAuthSession: async (user, requestContext) => {
        sessionCalls.push({ user, requestContext });
        if (sessionService.createAuthSession) {
          return sessionService.createAuthSession(user, requestContext);
        }
        return {
          user,
          token: "access-token",
          refreshToken: "refresh-token",
          expiresIn: 900,
        };
      },
      ...sessionService,
    },
  });

  const authService = await import(`../../src/services/auth.service.js?case=${Math.random()}`);
  return { ...authService, sessionCalls };
}

function assertAppError(err, { statusCode, code, message }) {
  assert.ok(err instanceof AppError);
  assert.equal(err.name, "AppError");
  assert.equal(err.statusCode, statusCode);
  assert.equal(err.code, code);
  if (message) assert.match(err.message, message);
  return true;
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
      return assertAppError(err, {
        statusCode: 409,
        code: "CONFLICT",
        message: /already exists/,
      });
    }
  );
});

test("registerUser creates a user, issues a session and a verification token, and lowercases email", async (t) => {
  const created = [];
  const verificationCalls = [];

  const { registerUser, sessionCalls } = await loadAuthService(t, {
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

  assert.equal(sessionCalls.length, 1);
  assert.equal(sessionCalls[0].requestContext.userAgent, "agent");
  assert.equal(sessionCalls[0].requestContext.ipAddress, "1.2.3.4");

  assert.equal(verificationCalls.length, 1);

  assert.equal(result.token, "access-token");
  assert.equal(result.refreshToken, "refresh-token");
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
      return assertAppError(err, {
        statusCode: 401,
        code: "AUTHENTICATION_REQUIRED",
        message: /Invalid email or password/,
      });
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
      return assertAppError(err, {
        statusCode: 401,
        code: "AUTHENTICATION_REQUIRED",
      });
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
      return assertAppError(err, {
        statusCode: 401,
        code: "AUTHENTICATION_REQUIRED",
      });
    }
  );
});

test("loginUser issues a session for valid credentials", async (t) => {
  const passwordHash = await hashPassword("correct-password");
  const { loginUser, sessionCalls } = await loadAuthService(t, {
    userRepo: {
      findUserByEmail: async () =>
        createUserRow({ password_hash: passwordHash, role: "user" }),
    },
  });

  const result = await loginUser(
    { email: "user@example.com", password: "correct-password" },
    { userAgent: "ua", ipAddress: "ip" }
  );

  assert.equal(sessionCalls.length, 1);
  assert.equal(sessionCalls[0].requestContext.userAgent, "ua");
  assert.equal(sessionCalls[0].requestContext.ipAddress, "ip");
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
