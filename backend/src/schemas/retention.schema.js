import { z } from "zod";
import {
  RETENTION_ADMIN_ACTIONS,
  RETENTION_CATEGORY_VALUES,
} from "../constants/retention.js";
import { uuidSchema } from "../domain/validators.js";

const retentionReasonSchema = z.string().trim().min(10).max(2000);

export const runRetentionJobsSchema = z
  .object({
    dryRun: z.boolean().default(true),
    limit: z.number().int().min(1).max(1000).default(100),
    categories: z.array(z.enum(RETENTION_CATEGORY_VALUES)).optional(),
    reason: retentionReasonSchema.optional(),
  })
  .strict();

export const retentionAdminActionSchema = z
  .object({
    action: z.enum(Object.values(RETENTION_ADMIN_ACTIONS)),
    category: z.enum(RETENTION_CATEGORY_VALUES),
    targetId: uuidSchema.optional(),
    retentionUntil: z.string().datetime().optional(),
    scheduledAnonymizationAt: z.string().datetime().optional(),
    legalHold: z.boolean().optional(),
    reason: retentionReasonSchema,
    dryRun: z.boolean().optional(),
    limit: z.number().int().min(1).max(1000).optional(),
    categories: z.array(z.enum(RETENTION_CATEGORY_VALUES)).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.action === RETENTION_ADMIN_ACTIONS.RUN) {
      return;
    }

    if (!data.targetId) {
      ctx.addIssue({
        code: "custom",
        message: "targetId is required for this action",
        path: ["targetId"],
      });
    }

    if (
      data.action === RETENTION_ADMIN_ACTIONS.SCHEDULE_ANONYMIZATION &&
      !data.scheduledAnonymizationAt
    ) {
      ctx.addIssue({
        code: "custom",
        message: "scheduledAnonymizationAt is required",
        path: ["scheduledAnonymizationAt"],
      });
    }

    if (data.action === RETENTION_ADMIN_ACTIONS.OVERRIDE_RETENTION_UNTIL && !data.retentionUntil) {
      ctx.addIssue({
        code: "custom",
        message: "retentionUntil is required",
        path: ["retentionUntil"],
      });
    }
  });

export const retentionRunResponseSchema = z.object({
  dryRun: z.boolean(),
  startedAt: z.string(),
  completedAt: z.string(),
  results: z.record(z.string(), z.unknown()),
});

export const retentionActionResponseSchema = z.object({
  category: z.string().optional(),
  targetId: z.string().uuid().optional(),
  action: z.string(),
  applied: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  results: z.record(z.string(), z.unknown()).optional(),
});
