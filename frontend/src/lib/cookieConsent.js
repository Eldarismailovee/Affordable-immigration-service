export const COOKIE_CONSENT_VERSION = "2026-05-31-v3";
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

export function detectGlobalPrivacyControl() {
  try {
    return typeof navigator !== "undefined" && navigator.globalPrivacyControl === true;
  } catch {
    return false;
  }
}

export function applyGpcConstraints({ analytics, marketing }) {
  if (!detectGlobalPrivacyControl()) {
    return { analytics: Boolean(analytics), marketing: Boolean(marketing), gpcActive: false };
  }

  return {
    analytics: false,
    marketing: false,
    gpcActive: true,
  };
}

export function getDefaultConsent() {
  return {
    version: COOKIE_CONSENT_VERSION,
    strictlyNecessary: true,
    analytics: false,
    marketing: false,
    gpcActive: detectGlobalPrivacyControl(),
    regionHint: "unknown",
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
  if (detectGlobalPrivacyControl()) {
    return false;
  }

  return getConsent() === null;
}

export function saveConsent({ analytics, marketing, source, anonymousId, gpcActive }) {
  const existing = readStoredRaw();
  const constrained = applyGpcConstraints({ analytics, marketing });
  const consent = {
    version: COOKIE_CONSENT_VERSION,
    strictlyNecessary: true,
    analytics: constrained.analytics,
    marketing: constrained.marketing,
    gpcActive: gpcActive ?? constrained.gpcActive,
    regionHint: existing?.regionHint ?? "unknown",
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
  if (category === "strictly_necessary" || category === "strictlyNecessary" || category === "necessary") {
    return true;
  }

  const consent = getConsent();

  if (!consent) {
    return false;
  }

  if (detectGlobalPrivacyControl()) {
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

export const hasCookieConsent = hasConsent;
export const getCookieConsent = getConsent;
export const saveCookieConsent = saveConsent;

export function onConsentChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export const onCookieConsentChange = onConsentChange;

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

export const applyConsentToVendors = applyConsentedScripts;

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
