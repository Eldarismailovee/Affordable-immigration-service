import { z } from "zod";
import { documentStatusSchema, uuidSchema } from "../../domain/validators.js";
import { dateLikeSchema, nullableStringSchema } from "./shared.schema.js";

const packetApprovalFields = {
  status: documentStatusSchema.optional(),
  generated_at: dateLikeSchema.optional(),
  approved_by: uuidSchema.nullable().optional(),
  approved_at: dateLikeSchema.nullable().optional(),
  review_notes: nullableStringSchema.optional(),
  updated_at: dateLikeSchema.optional(),
};

const agreementDocumentSchema = z
  .object({
    id: uuidSchema,
    lead_id: uuidSchema,
    title: z.string(),
    html_content: z.string(),
    ...packetApprovalFields,
  })
  .passthrough();

const onboardingDocumentSchema = z
  .object({
    id: uuidSchema,
    lead_id: uuidSchema,
    title: z.string(),
    html_content: z.string(),
    ...packetApprovalFields,
  })
  .passthrough();

export const agreementPreviewResponseSchema = z.object({
  agreementTitle: z.string(),
  html: z.string(),
});

export const agreementResponseSchema = z.object({
  agreement: agreementDocumentSchema,
});

export const agreementGenerationResponseSchema = z.object({
  alreadyExists: z.boolean(),
  agreement: agreementDocumentSchema,
});

export const onboardingPacketResponseSchema = z.object({
  onboarding: onboardingDocumentSchema,
});

export const onboardingGenerationResponseSchema = z.object({
  alreadyExists: z.boolean(),
  onboarding: onboardingDocumentSchema,
});

export const packetApprovalResponseSchema = z.object({
  agreement: agreementDocumentSchema.optional(),
  onboarding: onboardingDocumentSchema.optional(),
});
