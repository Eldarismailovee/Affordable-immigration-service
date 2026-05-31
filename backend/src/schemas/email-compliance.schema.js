import { z } from "zod";
import { EMAIL_SUPPRESSION_SCOPES } from "../constants/emailCompliance.js";

const suppressionScopeValues = Object.values(EMAIL_SUPPRESSION_SCOPES);

export const unsubscribeSchema = z.object({
  token: z.string().trim().min(20).max(500),
  scope: z.enum(suppressionScopeValues).default(EMAIL_SUPPRESSION_SCOPES.MARKETING),
});

export const emailPreferencesSchema = z.object({
  marketingConsent: z.boolean().optional(),
  newsletterConsent: z.boolean().optional(),
});

export const newsletterSignupSchema = z.object({
  email: z.string().trim().email(),
  marketingConsent: z.literal(true),
});
