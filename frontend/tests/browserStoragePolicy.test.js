import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");

const LOCAL_STORAGE_ALLOWLIST = new Set([
  path.join(SRC, "services/safeBrowserStorage.js"),
]);

const SESSION_STORAGE_ALLOWLIST = new Set([
  path.join(SRC, "services/sessionNavigationStorage.js"),
]);

const SENSITIVE_KEY_PATTERN =
  /(?:token|refresh|auth|user|profile|email|intake|case|booking|payment|dsar|agreement|mfa|recovery|verification|password|document|draft|session)/i;

function listSourceFiles(dir) {
  const entries = [];

  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      entries.push(...listSourceFiles(fullPath));
      continue;
    }

    if (/\.(js|jsx)$/.test(entry)) {
      entries.push(fullPath);
    }
  }

  return entries;
}

function findDirectCalls(files, pattern, allowlist) {
  const violations = [];

  for (const file of files) {
    if (allowlist.has(file)) {
      continue;
    }

    const content = readFileSync(file, "utf8");
    const matches = content.match(pattern);

    if (matches?.length) {
      violations.push({ file, count: matches.length });
    }
  }

  return violations;
}

const sourceFiles = listSourceFiles(SRC);

test("direct localStorage.setItem calls are confined to safeBrowserStorage", () => {
  const violations = findDirectCalls(
    sourceFiles,
    /localStorage\.setItem/g,
    LOCAL_STORAGE_ALLOWLIST
  );

  assert.deepEqual(violations, []);
});

test("direct localStorage.getItem calls are confined to safeBrowserStorage", () => {
  const violations = findDirectCalls(
    sourceFiles,
    /localStorage\.getItem/g,
    LOCAL_STORAGE_ALLOWLIST
  );

  assert.deepEqual(violations, []);
});

test("direct sessionStorage.setItem calls are confined to sessionNavigationStorage", () => {
  const violations = findDirectCalls(
    sourceFiles,
    /sessionStorage\.setItem/g,
    SESSION_STORAGE_ALLOWLIST
  );

  assert.deepEqual(violations, []);
});

test("frontend source does not reference indexedDB.open", () => {
  for (const file of sourceFiles) {
    const content = readFileSync(file, "utf8");
    assert.doesNotMatch(content, /indexedDB\.open/);
  }
});

test("IntakeContext does not use browser storage", () => {
  const content = readFileSync(path.join(SRC, "context/IntakeContext.jsx"), "utf8");
  assert.doesNotMatch(content, /localStorage/);
  assert.doesNotMatch(content, /sessionStorage/);
});

test("auth api keeps access token in memory", () => {
  const api = readFileSync(path.join(SRC, "services/api.js"), "utf8");
  assert.match(api, /let accessToken = null/);
  assert.doesNotMatch(api, /localStorage.*token/i);
});

test("VITE env bundle does not expose server secret names", () => {
  for (const file of sourceFiles) {
    const content = readFileSync(file, "utf8");
    assert.doesNotMatch(content, /VITE_.*(AUTH_TOKEN_SECRET|MFA_ENCRYPTION_KEY|DATABASE_URL|IDEMPOTENCY)/i);
  }
});

test("safe storage rejects sensitive-looking keys", async () => {
  const { setSafeItem } = await import("../src/services/safeBrowserStorage.js");

  assert.throws(() => setSafeItem("user", "x"));
  assert.throws(() => setSafeItem("ais.ui.intake", "x"));
});

test("safe storage accepts theme preference key", async () => {
  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => {
      storage[key] = value;
    },
    removeItem: (key) => {
      delete storage[key];
    },
  };

  const { setSafeItem, getSafeItem } = await import("../src/services/safeBrowserStorage.js");
  setSafeItem("ais.ui.theme", "dark");
  assert.equal(getSafeItem("ais.ui.theme"), "dark");
});

test("legacy cleanup removes known sensitive keys without logging values", async () => {
  const storage = {};
  globalThis.localStorage = {
    getItem: (key) => storage[key] ?? null,
    setItem: (key, value) => {
      storage[key] = value;
    },
    removeItem: (key) => {
      delete storage[key];
    },
    key(index) {
      return Object.keys(storage)[index] ?? null;
    },
    get length() {
      return Object.keys(storage).length;
    },
  };

  const logs = [];
  const originalLog = console.log;
  console.log = (...args) => logs.push(args);

  const { seedLegacyStorageForTests, cleanupLegacyBrowserStorage } = await import(
    "../src/services/legacyStorageCleanup.js"
  );

  seedLegacyStorageForTests();
  globalThis.localStorage.setItem("ais.ui.theme", "dark");

  const first = cleanupLegacyBrowserStorage();
  assert.equal(first.ran, true);
  assert.equal(globalThis.localStorage.getItem("immigration-intake"), null);
  assert.equal(globalThis.localStorage.getItem("user"), null);
  assert.equal(globalThis.localStorage.getItem("token"), null);
  assert.equal(globalThis.localStorage.getItem("ais.ui.theme"), "dark");

  const second = cleanupLegacyBrowserStorage();
  assert.equal(second.ran, false);
  assert.equal(logs.length, 0);

  console.log = originalLog;
});

test("return path sanitizer blocks external redirects", async () => {
  const { sanitizeReturnPath } = await import("../src/utils/safeReturnPath.js");

  assert.equal(sanitizeReturnPath("/account"), "/account");
  assert.equal(sanitizeReturnPath("//evil.example"), null);
  assert.equal(sanitizeReturnPath("https://evil.example"), null);
  assert.equal(sanitizeReturnPath("/account?next=//evil.example"), "/account");
});
