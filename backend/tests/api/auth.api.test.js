import { before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { clearStore, setupTestEnvironment } from "../helpers/buildTestApp.js";
import { withApp } from "../helpers/httpClient.js";
import {
  getRefreshCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../../src/utils/authCookies.js";

let app;
let store;

before(async () => {
  ({ app, store } = await setupTestEnvironment());
});

beforeEach(() => {
  clearStore(store);
});

function getRefreshCookie(res) {
  return res.cookies[REFRESH_TOKEN_COOKIE_NAME];
}

function assertRefreshCookie(res) {
  const cookieValue = getRefreshCookie(res);
  assert.ok(cookieValue, "refresh token cookie should be set");

  const setCookie = res.headers["set-cookie"];
  const header = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie || "";
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  assert.match(header, /Path=\//);

  return cookieValue;
}

test("POST /api/auth/register creates a user and returns a session", async () => {
  await withApp(app, async (client) => {
    const res = await client.post("/api/auth/register", {
      fullName: "Demo User",
      email: "Demo@example.com",
      password: "longenough1",
    });

    assert.equal(res.status, 201);
    assert.equal(res.body.user.email, "demo@example.com");
    assert.equal(res.body.user.role, "admin");
    assert.ok(res.body.token);
    assert.equal(res.body.refreshToken, undefined);
    assertRefreshCookie(res);
    assert.equal(store.users.size, 1);
  });
});

test("POST /api/auth/register rejects an invalid payload with 400 and a structured errors[]", async () => {
  await withApp(app, async (client) => {
    const res = await client.post("/api/auth/register", {
      fullName: "",
      email: "not-an-email",
      password: "short",
    });

    assert.equal(res.status, 400);
    assert.equal(res.body.message, "Validation failed");
    assert.ok(Array.isArray(res.body.errors));
    const paths = res.body.errors.map((issue) => issue.path).sort();
    assert.deepEqual(paths, ["email", "fullName", "password"]);
  });
});

test("POST /api/auth/register rejects a duplicate email with 409", async () => {
  await withApp(app, async (client) => {
    const payload = {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    };

    const first = await client.post("/api/auth/register", payload);
    assert.equal(first.status, 201);

    const second = await client.post("/api/auth/register", payload);
    assert.equal(second.status, 409);
    assert.match(second.body.message, /already exists/);
    assert.equal(typeof second.body.requestId, "string");
  });
});

test("POST /api/auth/login rejects bad credentials with 401 and a generic message", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "correct-password-123",
    });

    const res = await client.post("/api/auth/login", {
      email: "demo@example.com",
      password: "wrong-password",
    });

    assert.equal(res.status, 401);
    assert.match(res.body.message, /Invalid email or password/);
  });
});

test("POST /api/auth/login accepts good credentials and returns a token", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "correct-password-123",
    });

    client.clearCookies();

    const res = await client.post("/api/auth/login", {
      email: "demo@example.com",
      password: "correct-password-123",
    });

    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.refreshToken, undefined);
    assertRefreshCookie(res);
  });
});

test("GET /api/auth/me returns 401 without a token", async () => {
  await withApp(app, async (client) => {
    const res = await client.get("/api/auth/me");
    assert.equal(res.status, 401);
    assert.equal(res.body.message, "Authentication required");
  });
});

test("GET /api/auth/me returns the authenticated user when given a valid token", async () => {
  await withApp(app, async (client) => {
    const register = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    });

    const res = await client.get("/api/auth/me", { token: register.body.token });
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, "demo@example.com");
  });
});

test("POST /api/auth/refresh rotates the refresh token cookie (the old one stops working)", async () => {
  await withApp(app, async (client) => {
    const register = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    });

    const oldRefresh = getRefreshCookie(register);
    client.clearCookies();

    const refresh = await client.post("/api/auth/refresh", {}, { cookies: { [REFRESH_TOKEN_COOKIE_NAME]: oldRefresh } });
    assert.equal(refresh.status, 200);
    assert.ok(refresh.body.token);
    assert.equal(refresh.body.refreshToken, undefined);
    const newRefresh = assertRefreshCookie(refresh);
    assert.notEqual(newRefresh, oldRefresh);

    const reuse = await client.post("/api/auth/refresh", {}, { cookies: { [REFRESH_TOKEN_COOKIE_NAME]: oldRefresh } });
    assert.equal(reuse.status, 401);
  });
});

test("POST /api/auth/logout revokes the refresh token (cannot be reused)", async () => {
  await withApp(app, async (client) => {
    const register = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "longenough1",
    });

    const refreshToken = getRefreshCookie(register);

    const logout = await client.post("/api/auth/logout");
    assert.equal(logout.status, 200);

    const reuse = await client.post("/api/auth/refresh", {}, { cookies: { [REFRESH_TOKEN_COOKIE_NAME]: refreshToken } });
    assert.equal(reuse.status, 401);
  });
});

test("refresh cookie options include HttpOnly, SameSite, and Path", () => {
  const options = getRefreshCookieOptions();
  assert.equal(options.httpOnly, true);
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
});

test("POST /api/auth/password-reset/request returns the same generic message regardless of email existence", async () => {
  await withApp(app, async (client) => {
    const known = await client.post("/api/auth/password-reset/request", {
      email: "known@example.com",
    });
    const unknown = await client.post("/api/auth/password-reset/request", {
      email: "unknown@example.com",
    });

    assert.equal(known.status, 200);
    assert.equal(unknown.status, 200);
    assert.equal(known.body.message, unknown.body.message);
  });
});

test("password reset full flow: request → confirm → can log in with the new password", async () => {
  await withApp(app, async (client) => {
    await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "old-password-1",
    });

    const reqRes = await client.post("/api/auth/password-reset/request", {
      email: "demo@example.com",
    });
    assert.equal(reqRes.status, 200);
    assert.ok(reqRes.body.debugToken, "debug token should be returned in non-prod");

    const confirm = await client.post("/api/auth/password-reset/confirm", {
      token: reqRes.body.debugToken,
      password: "brand-new-password-1",
    });
    assert.equal(confirm.status, 200);

    const oldLogin = await client.post("/api/auth/login", {
      email: "demo@example.com",
      password: "old-password-1",
    });
    assert.equal(oldLogin.status, 401);

    const newLogin = await client.post("/api/auth/login", {
      email: "demo@example.com",
      password: "brand-new-password-1",
    });
    assert.equal(newLogin.status, 200);
  });
});

test("an active session's refresh token is invalidated after a password reset", async () => {
  await withApp(app, async (client) => {
    const register = await client.post("/api/auth/register", {
      fullName: "Demo",
      email: "demo@example.com",
      password: "old-password-1",
    });

    const refreshToken = getRefreshCookie(register);

    const reqRes = await client.post("/api/auth/password-reset/request", {
      email: "demo@example.com",
    });

    await client.post("/api/auth/password-reset/confirm", {
      token: reqRes.body.debugToken,
      password: "brand-new-password-1",
    });

    client.clearCookies();

    const refresh = await client.post("/api/auth/refresh", {}, { cookies: { [REFRESH_TOKEN_COOKIE_NAME]: refreshToken } });
    assert.equal(refresh.status, 401);
  });
});

test("error responses always carry the standard envelope fields", async () => {
  await withApp(app, async (client) => {
    const res = await client.post("/api/auth/login", {
      email: "ghost@example.com",
      password: "anything-is-fine",
    });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(typeof res.body.message, "string");
    assert.equal(typeof res.body.code, "string");
    assert.equal(typeof res.body.traceId, "string");
    assert.equal(typeof res.body.requestId, "string");
    assert.equal(res.body.traceId, res.body.requestId);
  });
});
