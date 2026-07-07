import assert from "node:assert/strict";
import { randomUUID } from "crypto";
import { test } from "node:test";
import { withApp } from "../helpers/httpClient.js";

const PRODUCTION_ENV = {
  NODE_ENV: "production",
  CLIENT_URL: "https://example.com",
  BASE_URL: "https://api.example.com",
  DATABASE_URL: "postgresql://user:password@db.example.com:5432/app",
  AUTH_TOKEN_SECRET: "x".repeat(32),
  MFA_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
  APP_PUBLIC_URL: "https://example.com",
  CORS_ORIGINS: "https://example.com",
  PAYMENT_HOST_ALLOWLIST: "checkout.stripe.com",
};

const CONFIG_KEYS = [
  "NODE_ENV",
  "CLIENT_URL",
  "BASE_URL",
  "DATABASE_URL",
  "AUTH_TOKEN_SECRET",
  "MFA_ENCRYPTION_KEY",
  "CORS_ORIGINS",
  "DOCUMENT_ENCRYPTION_KEY_BASE64",
];

function withProductionEnv() {
  const previous = new Map();

  for (const key of CONFIG_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(PRODUCTION_ENV)) {
    process.env[key] = value;
  }

  return () => {
    for (const key of CONFIG_KEYS) {
      const value = previous.get(key);

      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

test("production responses include CSP and security headers", async () => {
  const restore = withProductionEnv();

  try {
    const { default: app } = await import(`../../src/app.js?case=${randomUUID()}`);

    await withApp(app, async (client) => {
      const res = await client.get("/api/health");

      assert.equal(res.status, 200);

      const csp = res.headers["content-security-policy"];
      assert.ok(csp, "Content-Security-Policy header should be present");
      assert.match(csp, /default-src 'self'/);
      assert.match(csp, /object-src 'none'/);
      assert.match(csp, /frame-ancestors 'none'/);
      assert.doesNotMatch(csp, /script-src [^;]*\*/);

      assert.equal(res.headers["x-content-type-options"], "nosniff");
      assert.equal(res.headers["referrer-policy"], "strict-origin-when-cross-origin");
      assert.match(
        res.headers["strict-transport-security"],
        /max-age=31536000/
      );
    });
  } finally {
    restore();
  }
});

test("production refresh cookie uses __Host- prefix and Secure flag", async () => {
  const restore = withProductionEnv();

  try {
    const { REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieOptions } = await import(
      `../../src/utils/authCookies.js?case=${randomUUID()}`
    );

    assert.equal(REFRESH_TOKEN_COOKIE_NAME, "__Host-refresh_token");

    const options = getRefreshCookieOptions();
    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, "lax");
    assert.equal(options.path, "/");
  } finally {
    restore();
  }
});
