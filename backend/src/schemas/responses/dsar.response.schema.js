import { z } from "zod";
import {
  DSAR_IDENTITY_STATUSES,
  DSAR_REQUEST_TYPES,
  DSAR_STATUSES,
} from "../../constants/dsar.js";
import { uuidSchema } from "../../domain/validators.js";
import { dateLikeSchema, nullableStringSchema } from "./shared.schema.js";

export const dsarRequestSummarySchema = z.object({
  id: uuidSchema,
  type: z.enum(DSAR_REQUEST_TYPES),
  status: z.enum(DSAR_STATUSES),
  identityVerificationStatus: z.enum(DSAR_IDENTITY_STATUSES),
  legalHold: z.boolean(),
  userMessage: nullableStringSchema,
  createdAt: dateLikeSchema,
  updatedAt: dateLikeSchema,
  completedAt: dateLikeSchema.nullable().optional(),
});

export const dsarRequestDetailSchema = dsarRequestSummarySchema.extend({
  requestedChanges: z.record(z.string(), z.unknown()).nullable().optional(),
  hasExport: z.boolean().optional(),
});

export const dsarRequestListResponseSchema = z.object({
  requests: z.array(dsarRequestSummarySchema),
});

export const dsarRequestMutationResponseSchema = z.object({
  request: dsarRequestDetailSchema,
});

export const dsarEventSchema = z.object({
  id: uuidSchema,
  eventType: z.string(),
  actorUserId: uuidSchema.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  createdAt: dateLikeSchema,
});

export const adminDsarRequestSchema = dsarRequestDetailSchema.extend({
  requesterUserId: uuidSchema,
  requesterEmail: z.string(),
  adminNotes: nullableStringSchema,
  legalHoldReason: nullableStringSchema,
  identityVerifiedAt: dateLikeSchema.nullable().optional(),
  events: z.array(dsarEventSchema).optional(),
});

export const adminDsarRequestListResponseSchema = z.object({
  requests: z.array(adminDsarRequestSchema),
});

export const adminDsarRequestMutationResponseSchema = z.object({
  request: adminDsarRequestSchema,
});

export const dsarExportResponseSchema = z.object({
  generatedAt: dateLikeSchema,
  export: z.record(z.string(), z.unknown()),
});
