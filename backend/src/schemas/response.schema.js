import { z } from "zod";
import {
  agreementStatusSchema,
  bookingStatusSchema,
  docketwiseStatusSchema,
  documentStatusSchema,
  languageModeSchema,
  leadStatusSchema,
  packageTypeSchema,
  paymentStatusSchema,
  userRoleSchema,
  userStatusSchema,
  uuidSchema,
} from "../domain/validators.js";

const dateLikeSchema = z.union([z.string(), z.date()]);
const nullableStringSchema = z.string().nullable().optional();
const nullableNumberSchema = z.number().nullable().optional();

export const userResponseSchema = z
  .object({
    id: uuidSchema,
    email: z.email(),
    fullName: z.string(),
    role: userRoleSchema,
    status: userStatusSchema,
    emailVerifiedAt: dateLikeSchema.nullable().optional(),
    createdAt: dateLikeSchema.optional(),
    updatedAt: dateLikeSchema.optional(),
  })
  .passthrough();

export const authResponseSchema = z.object({
  user: userResponseSchema,
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const tokenRefreshResponseSchema = z.object({
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const messageResponseSchema = z
  .object({
    message: z.string(),
    debugToken: z.string().optional(),
  })
  .passthrough();

export const meResponseSchema = z.object({
  user: userResponseSchema.nullable(),
});

export const usersListResponseSchema = z.object({
  users: z.array(userResponseSchema),
});

export const userMutationResponseSchema = z.object({
  user: userResponseSchema,
});

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

const nullableEntityByLeadSchema = z
  .object({
    id: uuidSchema,
    lead_id: uuidSchema,
  })
  .passthrough()
  .nullable();

export const leadDetailResponseSchema = z.object({
  lead: leadMutationResponseSchema.shape.lead,
  intake: nullableEntityByLeadSchema,
  agreement: nullableEntityByLeadSchema,
  onboarding: nullableEntityByLeadSchema,
  booking: nullableEntityByLeadSchema,
  payment: nullableEntityByLeadSchema,
  docketwise: nullableEntityByLeadSchema,
});

export const paymentMutationResponseSchema = z.object({
  payment: z
    .object({
      id: uuidSchema,
      lead_id: uuidSchema,
      status: paymentStatusSchema,
      amount_min: z.number(),
      amount_max: z.number(),
      created_at: dateLikeSchema,
      updated_at: dateLikeSchema,
    })
    .passthrough(),
});

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

export const bookingCreateResponseSchema = z.object({
  success: z.boolean(),
  consultationType: z.string(),
  durationMinutes: z.number().int().positive(),
  email: z.string().nullable().optional(),
  status: z.string(),
});

export const docketwiseStubResponseSchema = z.object({
  success: z.boolean(),
  provider: z.string(),
  status: z.string(),
  message: z.string(),
  intakeEmail: z.email().nullable(),
});

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

export const docketwiseSyncResponseSchema = z.object({
  success: z.boolean(),
  provider: z.string(),
  message: z.string(),
  sync: docketwiseSyncRecordResponseSchema,
});

export const siteSettingsResponseSchema = z.object({
  settings: z
    .object({
      id: uuidSchema,
      firm_name: z.string(),
      phone: z.string(),
      email: z.email(),
      office_mode: z.string(),
      language_mode: languageModeSchema,
      updated_at: dateLikeSchema,
    })
    .passthrough(),
});

export const uploadImageResponseSchema = z.object({
  message: z.string(),
  file: z
    .object({
      filename: z.string(),
      originalName: z.string(),
      mimeType: z.string(),
      size: z.number(),
      url: z.string(),
    })
    .passthrough(),
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

export const pricingResponseSchema = z.object({
  selectedPackage: packageTypeSchema,
  additionalI130Count: z.number().int().min(0),
  expedited: z.boolean(),
  minTotal: z.number().int().min(0),
  maxTotal: z.number().int().min(0),
  filingFeesIncluded: z.boolean(),
});
