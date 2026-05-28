import { z } from "zod";
import {
  agreementStatusSchema,
  bookingStatusSchema,
  docketwiseStatusSchema,
  documentStatusSchema,
  leadStatusSchema,
  packageTypeSchema,
  paymentStatusSchema,
  uuidSchema,
} from "../../domain/validators.js";
import {
  dateLikeSchema,
  nullableEntityByLeadSchema,
  nullableNumberSchema,
  nullableStringSchema,
} from "./shared.schema.js";

export const leadSummaryResponseSchema = z
  .object({
    id: uuidSchema,
    first_name: z.string(),
    last_name: z.string(),
    email: z.email(),
    phone: z.string(),
    status: leadStatusSchema,
    created_at: dateLikeSchema,
    selected_package: packageTypeSchema.nullable().optional(),
    case_type: nullableStringSchema,
    agreement_status: agreementStatusSchema.nullable().optional(),
    booking_status: bookingStatusSchema.nullable().optional(),
    payment_status: paymentStatusSchema.nullable().optional(),
    docketwise_status: docketwiseStatusSchema.nullable().optional(),
    pricing_min: nullableNumberSchema,
    pricing_max: nullableNumberSchema,
    onboarding_status: documentStatusSchema.nullable().optional(),
    agreement_document_status: documentStatusSchema.nullable().optional(),
  })
  .passthrough();

export const leadsListResponseSchema = z.object({
  leads: z.array(leadSummaryResponseSchema),
});

export const leadMutationResponseSchema = z.object({
  lead: z
    .object({
      id: uuidSchema,
      user_id: uuidSchema.nullable().optional(),
      first_name: z.string(),
      last_name: z.string(),
      email: z.email(),
      phone: z.string(),
      status: leadStatusSchema,
      created_at: dateLikeSchema,
      updated_at: dateLikeSchema.optional(),
    })
    .passthrough(),
});

export const leadDetailResponseSchema = z.object({
  lead: leadMutationResponseSchema.shape.lead,
  intake: nullableEntityByLeadSchema,
  agreement: nullableEntityByLeadSchema,
  onboarding: nullableEntityByLeadSchema,
  booking: nullableEntityByLeadSchema,
  payment: nullableEntityByLeadSchema,
  docketwise: nullableEntityByLeadSchema,
});

export const intakeCreateResponseSchema = z.object({
  message: z.string(),
  lead: z
    .object({
      id: uuidSchema,
      firstName: z.string(),
      lastName: z.string(),
      email: z.email(),
      phone: z.string(),
      selectedPackage: packageTypeSchema,
      paymentStatus: paymentStatusSchema,
      status: leadStatusSchema,
      createdAt: z.string(),
    })
    .passthrough(),
});
