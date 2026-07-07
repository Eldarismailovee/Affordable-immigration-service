import {
  CURRENT_SAFE_STORAGE_VERSION,
  getStorageVersion,
  setStorageVersion,
} from "./safeBrowserStorage.js";

/** Known legacy keys that stored PII or security-sensitive data. */
export const LEGACY_SENSITIVE_KEYS = [
  "immigration-intake",
  "intake",
  "intake-draft",
  "auth",
  "auth_token",
  "access_token",
  "refresh_token",
  "token",
  "user",
  "profile",
  "session",
  "mfa",
  "mfa_challenge",
  "mfa_secret",
  "recovery_codes",
  "email_verification",
  "verification_token",
  "password_reset",
  "reset_token",
  "dsar",
  "payment",
  "booking",
  "agreement",
  "case",
  "case-review",
  "draft",
  "idempotency",
];

/** Legacy non-sensitive keys migrated to the safe namespace. */
export const LEGACY_MIGRATED_KEYS = ["cookie_consent_preferences"];

const LEGACY_PREFIXES = ["immigration-", "ais-auth-", "ais-intake-", "ais-user-"];

function getStorage() {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }
  return globalThis.localStorage;
}

function getSessionStorage() {
  if (typeof globalThis.sessionStorage === "undefined") {
    return null;
  }
  return globalThis.sessionStorage;
}

function removeKeyQuietly(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Never log removed values or keys containing user data.
  }
}

function collectLegacyLocalKeys(storage) {
  if (!storage) {
    return [];
  }

  const keys = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key) {
      continue;
    }

    const lower = key.toLowerCase();
    const isLegacy =
      LEGACY_SENSITIVE_KEYS.includes(key) ||
      LEGACY_MIGRATED_KEYS.includes(key) ||
      LEGACY_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      /(?:token|auth|user|profile|intake|case|booking|payment|dsar|agreement|mfa|recovery|verification|password|document|draft|session)/i.test(
        lower
      );

    if (isLegacy && !key.startsWith("ais.ui.") && key !== "ais.storage.version") {
      keys.push(key);
    }
  }

  return keys;
}

const LEGACY_SESSION_KEYS = [
  "returnPath",
  "intake",
  "auth",
  "user",
  "token",
  "mfa",
  "draft",
  "case",
  "payment",
  "dsar",
];

export function cleanupLegacySessionStorage() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  for (const key of LEGACY_SESSION_KEYS) {
    removeKeyQuietly(storage, key);
  }

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (!key) {
      continue;
    }

    if (/^(intake|auth|user|token|mfa|draft|case|payment|dsar|agreement)/i.test(key)) {
      removeKeyQuietly(storage, key);
    }
  }
}

export function cleanupLegacyBrowserStorage({ force = false } = {}) {
  const storage = getStorage();
  if (!storage) {
    return { ran: false, removedCount: 0 };
  }

  const currentVersion = getStorageVersion();

  if (!force && currentVersion >= CURRENT_SAFE_STORAGE_VERSION) {
    cleanupLegacySessionStorage();
    return { ran: false, removedCount: 0 };
  }

  let removedCount = 0;

  for (const key of collectLegacyLocalKeys(storage)) {
    removeKeyQuietly(storage, key);
    removedCount += 1;
  }

  for (const key of LEGACY_SENSITIVE_KEYS) {
    if (storage.getItem(key) !== null) {
      removeKeyQuietly(storage, key);
      removedCount += 1;
    }
  }

  for (const key of LEGACY_MIGRATED_KEYS) {
    if (storage.getItem(key) !== null) {
      removeKeyQuietly(storage, key);
      removedCount += 1;
    }
  }

  cleanupLegacySessionStorage();
  setStorageVersion(CURRENT_SAFE_STORAGE_VERSION);

  return { ran: true, removedCount };
}

/** Test-only helper */
export function seedLegacyStorageForTests(storage = globalThis.localStorage) {
  storage.setItem("immigration-intake", JSON.stringify({ email: "legacy@example.com" }));
  storage.setItem("user", JSON.stringify({ role: "admin" }));
  storage.setItem("token", "legacy-token");
  storage.setItem("mfa_secret", "ABCD1234");
  storage.setItem("cookie_consent_preferences", JSON.stringify({ analytics: true }));
}
