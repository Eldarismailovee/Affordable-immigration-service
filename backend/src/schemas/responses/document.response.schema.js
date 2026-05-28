import { z } from "zod";
import { documentStatusSchema, uuidSchema } from "../../domain/validators.js";
import { dateLikeSchema } from "./shared.schema.js";

const agreementDocumentSchema = z
  .object({
    id: uuidSchema,
    lead_id: uuidSchema,
    title: z.string(),
    html_content: z.string(),
    status: documentStatusSchema.optional(),
    generated_at: dateLikeSchema.optional(),
  })
  .passthrough();

const onboardingDocumentSchema = z
  .object({
    id: uuidSchema,
    lead_id: uuidSchema,
    title: z.string(),
    html_content: z.string(),
    status: documentStatusSchema.optional(),
    generated_at: dateLikeSchema.optional(),
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
