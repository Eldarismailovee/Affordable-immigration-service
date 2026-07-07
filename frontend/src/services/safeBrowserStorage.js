/**
 * Allowlisted persistent browser storage for non-sensitive UI preferences only.
 * Do not use for auth, PII, form drafts, or security state.
 */

export const CURRENT_SAFE_STORAGE_VERSION = 2;

const STORAGE_PREFIX = "ais.";

/** @type {ReadonlySet<string>} */
const ALLOWED_KEYS = new Set([
  `${STORAGE_PREFIX}storage.version`,
  `${STORAGE_PREFIX}ui.cookieConsent`,
  `${STORAGE_PREFIX}ui.theme`,
  `${STORAGE_PREFIX}ui.language`,
  `${STORAGE_PREFIX}ui.reducedMotion`,
  `${STORAGE_PREFIX}ui.density`,
  `${STORAGE_PREFIX}ui.cookieBannerDismissed`,
]);

/** @type {ReadonlySet<string>} */
const ALLOWED_OBJECT_KEYS = new Set([`${STORAGE_PREFIX}ui.cookieConsent`]);

function assertAllowedKey(key) {
  if (typeof key !== "string" || !ALLOWED_KEYS.has(key)) {
    throw new Error(`Storage key not allowed: ${String(key)}`);
  }
}

function getStorage() {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }
  return globalThis.localStorage;
}

export function isAllowedStorageKey(key) {
  return ALLOWED_KEYS.has(key);
}

export function getSafeItem(key) {
  assertAllowedKey(key);
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  return storage.getItem(key);
}

export function setSafeItem(key, value) {
  assertAllowedKey(key);

  if (value === null || value === undefined) {
    removeSafeItem(key);
    return;
  }

  if (typeof value === "object") {
    if (!ALLOWED_OBJECT_KEYS.has(key)) {
      throw new Error(`Object payloads are not allowed for key: ${key}`);
    }
    getStorage()?.setItem(key, JSON.stringify(value));
    return;
  }

  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new Error(`Unsupported value type for key: ${key}`);
  }

  getStorage()?.setItem(key, String(value));
}

export function removeSafeItem(key) {
  assertAllowedKey(key);
  getStorage()?.removeItem(key);
}

export function getSafeJson(key) {
  const raw = getSafeItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    removeSafeItem(key);
    return null;
  }
}

export function setSafeJson(key, value) {
  if (value === null || value === undefined) {
    removeSafeItem(key);
    return;
  }

  assertAllowedKey(key);

  if (!ALLOWED_OBJECT_KEYS.has(key)) {
    throw new Error(`JSON payloads are not allowed for key: ${key}`);
  }

  getStorage()?.setItem(key, JSON.stringify(value));
}

export function setStorageVersion(version = CURRENT_SAFE_STORAGE_VERSION) {
  getStorage()?.setItem(`${STORAGE_PREFIX}storage.version`, String(version));
}

export function getStorageVersion() {
  const raw = getStorage()?.getItem(`${STORAGE_PREFIX}storage.version`);
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Test-only helper */
export function resetSafeStorageForTests() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  for (const key of [...ALLOWED_KEYS]) {
    storage.removeItem(key);
  }
}
