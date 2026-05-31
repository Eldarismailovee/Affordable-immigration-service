import { createHash, randomUUID } from "crypto";
import { createCookieConsentLog } from "../repositories/cookie-consent.repository.js";

function hashValue(value) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(String(value)).digest("hex");
}

export async function logCookieConsent(payload, { user, userAgent, ipAddress }) {
  const anonymousId =
    payload.anonymousId || (user?.id ? null : randomUUID());

  return createCookieConsentLog({
    userId: user?.id ?? null,
    anonymousId,
    consentVersion: payload.consentVersion,
    strictlyNecessary: payload.strictlyNecessary,
    analytics: payload.analytics,
    marketing: payload.marketing,
    source: payload.source,
    regionHint: payload.regionHint ?? null,
    userAgentHash: hashValue(userAgent),
    ipHash: hashValue(ipAddress),
  });
}
