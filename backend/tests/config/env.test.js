import { randomUUID } from "crypto";
import { test } from "node:test";
import assert from "node:assert/strict";

const CONFIG_KEYS = [
  "NODE_ENV",
  "PORT",
  "CLIENT_URL",
  "BASE_URL",
  "DATABASE_URL",
  "CHROMIUM_PATH",
  "AUTH_TOKEN_SECRET",
  "CORS_ORIGINS",
  "LOG_LEVEL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
  "ADMIN_NAME",
  "DB_POOL_MAX",
  "DB_POOL_MIN",
  "DB_POOL_IDLE_TIMEOUT_MS",
  "DB_POOL_CONNECTION_TIMEOUT_MS",
  "DB_POOL_MAX_LIFETIME_SECONDS",
  "DB_POOL_MAX_USES",
  "DB_POOL_ALLOW_EXIT_ON_IDLE",
  "DB_APPLICATION_NAME",
  "DB_SLOW_QUERY_MS",
  "DB_SSL",
  "DB_SSL_REJECT_UNAUTHORIZED",
  "UPLOAD_STORAGE_DRIVER",
  "UPLOAD_VIRUS_SCAN_ENABLED",
  "UPLOAD_VIRUS_SCAN_COMMAND",
  "UPLOAD_VIRUS_SCAN_TIMEOUT_MS",
];

function withConfigEnv(overrides) {
  const previous = new Map();

  for (const key of CONFIG_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(overrides)) {
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

async function importEnvWith(overrides) {
  const restore = withConfigEnv(overrides);

  try {
    return await import(`../../src/config/env.js?case=${randomUUID()}`);
  } finally {
    restore();
  }
}

function validProductionEnv(overrides = {}) {
  return {
    NODE_ENV: "production",
    CLIENT_URL: "https://example.com",
    BASE_URL: "https://api.example.com",
    DATABASE_URL: "postgresql://user:password@db.example.com:5432/app",
    AUTH_TOKEN_SECRET: "x".repeat(32),
    ...overrides,
  };
}

test("env rejects production startup without DATABASE_URL", async () => {
  await assert.rejects(
    importEnvWith(validProductionEnv({ DATABASE_URL: "" })),
    /DATABASE_URL/
  );
});

test("env rejects non-PostgreSQL DATABASE_URL values", async () => {
  await assert.rejects(
    importEnvWith(validProductionEnv({ DATABASE_URL: "mysql://db.example.com/app" })),
    /PostgreSQL connection URL/
  );
});

test("env rejects placeholder auth secrets in production", async () => {
  await assert.rejects(
    importEnvWith(
      validProductionEnv({
        AUTH_TOKEN_SECRET: "replace-with-a-long-random-secret",
      })
    ),
    /placeholder value/
  );
});

test("env supplies a test database URL only in NODE_ENV=test", async () => {
  const { default: env } = await importEnvWith({
    NODE_ENV: "test",
    AUTH_TOKEN_SECRET: "x".repeat(32),
    DATABASE_URL: "",
  });

  assert.equal(env.isTest, true);
  assert.equal(env.DATABASE_URL, "postgresql://test:test@127.0.0.1:5432/test");
});

test("env parses CORS origins and database pool settings", async () => {
  const { default: env } = await importEnvWith(
    validProductionEnv({
      CORS_ORIGINS: "https://admin.example.com, https://app.example.com",
      DB_POOL_MAX: "20",
      DB_POOL_MIN: "2",
      DB_SLOW_QUERY_MS: "500",
      DB_SSL: "true",
      DB_SSL_REJECT_UNAUTHORIZED: "false",
    })
  );

  assert.deepEqual(env.CORS_ORIGINS, [
    "https://admin.example.com",
    "https://app.example.com",
  ]);
  assert.equal(env.DB_POOL_MAX, 20);
  assert.equal(env.DB_POOL_MIN, 2);
  assert.equal(env.DB_SLOW_QUERY_MS, 500);
  assert.equal(env.DB_SSL, true);
  assert.equal(env.DB_SSL_REJECT_UNAUTHORIZED, false);
});

test("env parses upload security settings", async () => {
  const { default: env } = await importEnvWith(
    validProductionEnv({
      UPLOAD_STORAGE_DRIVER: "local",
      UPLOAD_VIRUS_SCAN_ENABLED: "true",
      UPLOAD_VIRUS_SCAN_COMMAND: "clamdscan",
      UPLOAD_VIRUS_SCAN_TIMEOUT_MS: "15000",
    })
  );

  assert.equal(env.UPLOAD_STORAGE_DRIVER, "local");
  assert.equal(env.UPLOAD_VIRUS_SCAN_ENABLED, true);
  assert.equal(env.UPLOAD_VIRUS_SCAN_COMMAND, "clamdscan");
  assert.equal(env.UPLOAD_VIRUS_SCAN_TIMEOUT_MS, 15000);
});
