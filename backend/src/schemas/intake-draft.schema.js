import { z } from "zod";
import {
  consultationTypeSchema,
  packageTypeSchema,
  paymentPreferenceSchema,
} from "../domain/validators.js";
import { userFacingPaymentNotesSchema } from "./payment-notes.schema.js";

export const intakeDraftDataSchema = z
  .object({
    selectedPackage: packageTypeSchema.optional(),
    firstName: z.string().optional().default(""),
    lastName: z.string().optional().default(""),
    email: z.string().optional().default(""),
    phone: z.string().optional().default(""),
    caseType: z.string().optional().default(""),
    petitionRelationship: z.string().optional().default(""),
    location: z.string().optional().default(""),
    hasUrgentDeadline: z.boolean().optional().default(false),
    urgentDeadlineNotes: z.string().optional().default(""),
    notes: z.string().optional().default(""),
    additionalI130Count: z.number().int().min(0).optional().default(0),
    expedited: z.boolean().optional().default(false),
    consultationType: consultationTypeSchema.optional(),
    preferredDateTime: z.string().optional().default(""),
    billingName: z.string().optional().default(""),
    billingEmail: z.string().optional().default(""),
    paymentPreference: paymentPreferenceSchema.optional(),
    consentManualProcessing: z.boolean().optional().default(false),
    consentAvailabilityAcknowledgment: z.boolean().optional().default(false),
    paymentNotes: userFacingPaymentNotesSchema.optional().default(""),
  })
  .strict();

export const intakeDraftUpsertSchema = z.object({
  data: intakeDraftDataSchema,
  version: z.number().int().min(1).nullable().optional(),
});

export const intakeDraftResponseSchema = z.object({
  data: intakeDraftDataSchema,
  version: z.number().int().min(1),
  updatedAt: z.string(),
  expiresAt: z.string(),
});
