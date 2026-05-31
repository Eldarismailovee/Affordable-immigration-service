import { createHash, randomUUID } from "crypto";
import { EMAIL_SUPPRESSION_REASONS } from "../constants/emailCompliance.js";
import { createCookieConsentLog } from "../repositories/cookie-consent.repository.js";
import { suppressMarketingForUser } from "./email-compliance.service.js";

function hashValue(value) {
  if (!value) {
    return null;
  }

  return createHash("sha256").update(String(value)).digest("hex");
}

export async function logCookieConsent(payload, { user, userAgent, ipAddress }) {
  const anonymousId =
    payload.anonymousId || (user?.id ? null : randomUUID());

  const result = await createCookieConsentLog({
    userId: user?.id ?? null,
    anonymousId,
    consentVersion: payload.consentVersion,
    strictlyNecessary: payload.strictlyNecessary,
    analytics: payload.analytics,
    marketing: payload.marketing,
    gpcActive: payload.gpcActive ?? false,
    source: payload.source,
    regionHint: payload.regionHint ?? null,
    userAgentHash: hashValue(userAgent),
    ipHash: hashValue(ipAddress),
  });

  if (payload.gpcActive && user?.email && user?.id) {
    await suppressMarketingForUser({
      userId: user.id,
      email: user.email,
      reason: EMAIL_SUPPRESSION_REASONS.GPC,
      source: "gpc",
    });
  }

  return result;
}
