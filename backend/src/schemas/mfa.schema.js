import { z } from "zod";

const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "TOTP code must be 6 digits");

const recoveryCodeSchema = z
  .string()
  .trim()
  .min(8)
  .max(32);

export const mfaVerifySchema = z
  .object({
    challengeToken: z.string().trim().min(1),
    code: totpCodeSchema.optional(),
    recoveryCode: recoveryCodeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.code && !value.recoveryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either code or recoveryCode is required",
        path: ["code"],
      });
    }

    if (value.code && value.recoveryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide either code or recoveryCode, not both",
        path: ["code"],
      });
    }
  });

export const mfaStartEnrollmentSchema = z.object({
  password: z.string().min(1).optional(),
  challengeToken: z.string().trim().min(1).optional(),
});

export const mfaConfirmEnrollmentSchema = z.object({
  code: totpCodeSchema,
  challengeToken: z.string().trim().min(1).optional(),
});

export const mfaRegenerateRecoverySchema = z.object({
  password: z.string().min(1),
});

export const mfaDisableSchema = z
  .object({
    password: z.string().min(1),
    code: totpCodeSchema.optional(),
    recoveryCode: recoveryCodeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.code && !value.recoveryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either code or recoveryCode is required",
        path: ["code"],
      });
    }
  });

export const mfaStepUpSchema = z
  .object({
    code: totpCodeSchema.optional(),
    recoveryCode: recoveryCodeSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.code && !value.recoveryCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Either code or recoveryCode is required",
        path: ["code"],
      });
    }
  });

export const mfaAdminResetSchema = z.object({
  userId: z.string().uuid(),
});
