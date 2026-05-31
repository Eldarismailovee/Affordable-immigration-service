import test from "node:test";
import assert from "node:assert/strict";
import { COOKIE_CONSENT_VERSION } from "../../src/constants/cookie-consent.js";
import { cookieConsentLogSchema } from "../../src/schemas/cookie-consent.schema.js";

const validPayload = {
  consentVersion: COOKIE_CONSENT_VERSION,
  strictlyNecessary: true,
  analytics: false,
  marketing: false,
  source: "banner",
  anonymousId: "550e8400-e29b-41d4-a716-446655440000",
};

test("cookieConsentLogSchema accepts a valid payload", () => {
  const result = cookieConsentLogSchema.safeParse(validPayload);
  assert.equal(result.success, true);
});

test("cookieConsentLogSchema rejects strictlyNecessary=false", () => {
  const result = cookieConsentLogSchema.safeParse({
    ...validPayload,
    strictlyNecessary: false,
  });
  assert.equal(result.success, false);
});

test("cookieConsentLogSchema rejects invalid source", () => {
  const result = cookieConsentLogSchema.safeParse({
    ...validPayload,
    source: "popup",
  });
  assert.equal(result.success, false);
});

test("cookieConsentLogSchema accepts preferences source", () => {
  const result = cookieConsentLogSchema.safeParse({
    ...validPayload,
    source: "preferences",
    analytics: true,
    marketing: true,
  });
  assert.equal(result.success, true);
});

test("cookieConsentLogSchema rejects invalid anonymousId", () => {
  const result = cookieConsentLogSchema.safeParse({
    ...validPayload,
    anonymousId: "not-a-uuid",
  });
  assert.equal(result.success, false);
});
