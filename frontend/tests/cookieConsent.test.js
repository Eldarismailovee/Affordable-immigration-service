import test from "node:test";
import assert from "node:assert/strict";

const storage = {};

globalThis.localStorage = {
  getItem(key) {
    return Object.hasOwn(storage, key) ? storage[key] : null;
  },
  setItem(key, value) {
    storage[key] = String(value);
  },
  removeItem(key) {
    delete storage[key];
  },
  clear() {
    for (const key of Object.keys(storage)) {
      delete storage[key];
    }
  },
};

const {
  COOKIE_CONSENT_VERSION,
  applyConsentedScripts,
  areOptionalScriptsLoaded,
  detectGlobalPrivacyControl,
  getConsent,
  getDefaultConsent,
  hasConsent,
  getPreviousOptionalChoices,
  needsConsentPrompt,
  resetOptionalScriptStateForTests,
  saveConsent,
} = await import("../src/lib/cookieConsent.js");

test.beforeEach(() => {
  localStorage.clear();
  resetOptionalScriptStateForTests();
  Object.defineProperty(globalThis, "navigator", {
    value: {},
    configurable: true,
    writable: true,
  });
});

function withGpcEnabled(run) {
  Object.defineProperty(globalThis.navigator, "globalPrivacyControl", {
    value: true,
    configurable: true,
  });
  run();
  delete globalThis.navigator.globalPrivacyControl;
}

test("default optional categories are false", () => {
  const defaults = getDefaultConsent();
  assert.equal(defaults.strictlyNecessary, true);
  assert.equal(defaults.analytics, false);
  assert.equal(defaults.marketing, false);
});

test("strictly necessary cannot be disabled via saveConsent", () => {
  saveConsent({ analytics: false, marketing: false, source: "banner" });
  const consent = getConsent();
  assert.equal(consent.strictlyNecessary, true);
  assert.equal(hasConsent("strictly_necessary"), true);
});

test("accept all enables analytics and marketing", () => {
  saveConsent({ analytics: true, marketing: true, source: "banner" });
  assert.equal(hasConsent("analytics"), true);
  assert.equal(hasConsent("marketing"), true);
});

test("reject optional disables analytics and marketing", () => {
  saveConsent({ analytics: false, marketing: false, source: "banner" });
  assert.equal(hasConsent("analytics"), false);
  assert.equal(hasConsent("marketing"), false);
});

test("manage preferences saves exact choices", () => {
  saveConsent({ analytics: true, marketing: false, source: "preferences" });
  const consent = getConsent();
  assert.equal(consent.analytics, true);
  assert.equal(consent.marketing, false);
  assert.equal(consent.source, "preferences");
  assert.match(consent.anonymousId, /^[0-9a-f-]{36}$/i);
});

test("preferences page can withdraw consent", () => {
  saveConsent({ analytics: true, marketing: true, source: "banner" });
  saveConsent({ analytics: false, marketing: false, source: "preferences" });
  assert.equal(hasConsent("analytics"), false);
  assert.equal(hasConsent("marketing"), false);
});

test("optional scripts are not loaded before consent", () => {
  assert.equal(needsConsentPrompt(), true);
  applyConsentedScripts();
  assert.deepEqual(areOptionalScriptsLoaded(), { analytics: false, marketing: false });
});

test("optional scripts load only after consent", () => {
  saveConsent({ analytics: true, marketing: true, source: "banner" });
  applyConsentedScripts();
  assert.deepEqual(areOptionalScriptsLoaded(), { analytics: true, marketing: true });
});

test("version mismatch shows consent prompt again", () => {
  localStorage.setItem(
    "ais.ui.cookieConsent",
    JSON.stringify({
      version: "old-version",
      strictlyNecessary: true,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString(),
      source: "banner",
      anonymousId: "550e8400-e29b-41d4-a716-446655440000",
    })
  );

  assert.equal(getConsent(), null);
  assert.equal(needsConsentPrompt(), true);
  assert.equal(hasConsent("analytics"), false);
  assert.equal(COOKIE_CONSENT_VERSION, "2026-05-31-v3");
});

test("GPC forces marketing and analytics off", () => {
  withGpcEnabled(() => {
    saveConsent({ analytics: true, marketing: true, source: "banner" });
    assert.equal(hasConsent("analytics"), false);
    assert.equal(hasConsent("marketing"), false);
    const consent = getConsent();
    assert.equal(consent.gpcActive, true);
    assert.equal(consent.analytics, false);
    assert.equal(consent.marketing, false);
  });
});

test("accept all respects GPC and keeps optional categories off", () => {
  withGpcEnabled(() => {
    saveConsent({ analytics: true, marketing: true, source: "banner" });
    assert.equal(hasConsent("analytics"), false);
    assert.equal(hasConsent("marketing"), false);
  });
});

test("GPC skips consent banner prompt", () => {
  withGpcEnabled(() => {
    assert.equal(detectGlobalPrivacyControl(), true);
    assert.equal(needsConsentPrompt(), false);
  });
});

test("version mismatch preserves previous opt-outs in getPreviousOptionalChoices", () => {
  localStorage.setItem(
    "ais.ui.cookieConsent",
    JSON.stringify({
      version: "old-version",
      strictlyNecessary: true,
      analytics: true,
      marketing: false,
      updatedAt: new Date().toISOString(),
      source: "banner",
      anonymousId: "550e8400-e29b-41d4-a716-446655440000",
    })
  );

  assert.deepEqual(getPreviousOptionalChoices(), { analytics: true, marketing: false });
});
