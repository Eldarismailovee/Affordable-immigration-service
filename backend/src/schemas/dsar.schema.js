import { z } from "zod";
import {
  DSAR_IDENTITY_STATUSES,
  DSAR_REQUEST_TYPES,
  DSAR_STATUSES,
} from "../constants/dsar.js";
import { uuidSchema } from "../domain/validators.js";

export const dsarRequestIdParamsSchema = z.object({
  requestId: uuidSchema,
});

export const createDsarRequestSchema = z
  .object({
    type: z.enum(DSAR_REQUEST_TYPES),
    message: z.string().trim().min(1).max(4000).optional(),
    requestedChanges: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.type === "correction" && !data.requestedChanges) {
      ctx.addIssue({
        code: "custom",
        message: "requestedChanges is required for correction requests",
        path: ["requestedChanges"],
      });
    }
  });

export const adminIdentityVerificationSchema = z
  .object({
    status: z.enum(DSAR_IDENTITY_STATUSES),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const adminCorrectionActionSchema = z
  .object({
    userFields: z
      .object({
        fullName: z.string().trim().min(1).max(200).optional(),
      })
      .strict()
      .optional(),
    leadFields: z
      .object({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).optional(),
        phone: z.string().trim().min(1).max(50).optional(),
        email: z.email().optional(),
      })
      .strict()
      .optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict()
  .refine((data) => data.userFields || data.leadFields, {
    message: "At least one of userFields or leadFields is required",
  });

export const adminLegalHoldSchema = z
  .object({
    legalHold: z.boolean(),
    reason: z.string().trim().min(1).max(4000).optional(),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.legalHold && !data.reason) {
      ctx.addIssue({
        code: "custom",
        message: "reason is required when legal hold is enabled",
        path: ["reason"],
      });
    }
  });

export const adminStatusUpdateSchema = z
  .object({
    status: z.enum(DSAR_STATUSES),
    notes: z.string().trim().max(4000).optional(),
  })
  .strict();

export const adminNoteSchema = z
  .object({
    note: z.string().trim().min(1).max(4000),
  })
  .strict();
