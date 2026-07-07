import { z } from "zod";
import { userResponseSchema } from "./user.response.schema.js";
import { authResponseSchema } from "./auth.response.schema.js";

export const mfaChallengeResponseSchema = z.object({
  mfaRequired: z.boolean().optional(),
  mfaEnrollmentRequired: z.boolean().optional(),
  mfaChallengeToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
  user: userResponseSchema,
  code: z.string().optional(),
});

export const mfaEnrollmentStartResponseSchema = z.object({
  otpauthUri: z.string().min(1),
  qrCodeDataUrl: z.string().min(1),
  secret: z.string().min(1).optional(),
});

export const mfaEnrollmentConfirmResponseSchema = z.object({
  recoveryCodes: z.array(z.string().min(1)),
});

export const mfaEnrollmentCompleteResponseSchema = authResponseSchema.extend({
  recoveryCodes: z.array(z.string().min(1)),
});

export const mfaStatusResponseSchema = z.object({
  enrolled: z.boolean(),
  unusedRecoveryCodes: z.number().int().nonnegative(),
});

export const mfaStepUpResponseSchema = z.object({
  token: z.string().min(1),
  expiresIn: z.number().int().positive(),
  mfaCompletedAt: z.string().datetime(),
});
