import { updateEmailPreferences } from "../services/email-compliance.service.js";
import { sanitizeUser } from "../utils/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { z } from "zod";

const emailPreferencesResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    marketingConsent: z.boolean(),
    newsletterConsent: z.boolean(),
  }),
});

export const updateEmailPreferencesController = asyncHandler(async (req, res) => {
  const user = await updateEmailPreferences(req.user.id, req.body);
  sendResponse(res, emailPreferencesResponseSchema, {
    user: {
      id: user.id,
      email: user.email,
      marketingConsent: Boolean(user.marketing_consent),
      newsletterConsent: Boolean(user.newsletter_consent),
    },
  });
});

export const getEmailPreferencesController = asyncHandler(async (req, res) => {
  const sanitized = sanitizeUser(req.user);
  sendResponse(res, emailPreferencesResponseSchema, {
    user: {
      id: sanitized.id,
      email: sanitized.email,
      marketingConsent: sanitized.marketingConsent,
      newsletterConsent: sanitized.newsletterConsent,
    },
  });
});
