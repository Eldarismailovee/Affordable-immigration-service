import { z } from "zod";
import { COOKIE_CONSENT_SOURCES } from "../constants/cookie-consent.js";

export const cookieConsentLogSchema = z.object({
  consentVersion: z.string().min(1).max(64),
  strictlyNecessary: z.literal(true, {
    error: "Strictly necessary cookies must remain enabled",
  }),
  analytics: z.boolean(),
  marketing: z.boolean(),
  source: z.enum(COOKIE_CONSENT_SOURCES),
  anonymousId: z.string().uuid().optional(),
  regionHint: z.string().max(64).optional().nullable(),
});
