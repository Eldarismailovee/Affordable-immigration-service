import { z } from "zod";
import { docketwiseStatusSchema, uuidSchema } from "../../domain/validators.js";
import { dateLikeSchema } from "./shared.schema.js";

const docketwiseSyncRecordResponseSchema = z
  .object({
    id: uuidSchema,
    lead_id: uuidSchema,
    external_id: z.string().nullable().optional(),
    status: docketwiseStatusSchema,
    error_message: z.string().nullable().optional(),
    last_synced_at: dateLikeSchema.nullable().optional(),
    created_at: dateLikeSchema.optional(),
  })
  .passthrough();

export const docketwiseStubResponseSchema = z.object({
  success: z.boolean(),
  provider: z.string(),
  status: z.string(),
  message: z.string(),
  intakeEmail: z.email().nullable(),
});

export const docketwiseSyncResponseSchema = z.object({
  success: z.boolean(),
  provider: z.string(),
  message: z.string(),
  sync: docketwiseSyncRecordResponseSchema,
});
