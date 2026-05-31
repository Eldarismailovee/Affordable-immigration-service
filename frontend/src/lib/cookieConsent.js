export const COOKIE_CONSENT_VERSION = "2026-05-31-v2";
const STORAGE_KEY = "cookie_consent_preferences";

const listeners = new Set();
let analyticsLoaded = false;
let marketingLoaded = false;

function readStoredRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function notifyListeners(consent) {
  for (const listener of listeners) {
    listener(consent);
  }
}

export function getDefaultConsent() {
  return {
    version: COOKIE_CONSENT_VERSION,
    strictlyNecessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
    source: null,
    anonymousId: null,
  };
}

export function getPreviousOptionalChoices() {
  const stored = readStoredRaw();

  if (!stored) {
    return { analytics: false, marketing: false };
  }

  return {
    analytics: Boolean(stored.analytics),
    marketing: Boolean(stored.marketing),
  };
}

export function getConsent() {
  const stored = readStoredRaw();

  if (!stored || stored.version !== COOKIE_CONSENT_VERSION) {
    return null;
  }

  return stored;
}

export function needsConsentPrompt() {
  return getConsent() === null;
}

export function saveConsent({ analytics, marketing, source, anonymousId }) {
  const existing = readStoredRaw();
  const consent = {
    version: COOKIE_CONSENT_VERSION,
    strictlyNecessary: true,
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
    updatedAt: new Date().toISOString(),
    source,
    anonymousId: anonymousId || existing?.anonymousId || crypto.randomUUID(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  notifyListeners(consent);
  applyConsentedScripts();
  return consent;
}

export function hasConsent(category) {
  if (category === "strictly_necessary" || category === "strictlyNecessary") {
    return true;
  }

  const consent = getConsent();

  if (!consent) {
    return false;
  }

  if (category === "analytics") {
    return consent.analytics === true;
  }

  if (category === "marketing") {
    return consent.marketing === true;
  }

  return false;
}

export function onConsentChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function loadAnalytics() {
  if (!hasConsent("analytics") || analyticsLoaded) {
    return;
  }

  analyticsLoaded = true;
}

export function loadMarketing() {
  if (!hasConsent("marketing") || marketingLoaded) {
    return;
  }

  marketingLoaded = true;
}

export function applyConsentedScripts() {
  loadAnalytics();
  loadMarketing();
}

export function resetOptionalScriptStateForTests() {
  analyticsLoaded = false;
  marketingLoaded = false;
}

export function areOptionalScriptsLoaded() {
  return {
    analytics: analyticsLoaded,
    marketing: marketingLoaded,
  };
}
