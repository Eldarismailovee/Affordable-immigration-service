import { z } from "zod";
import {
  consultationTypeSchema,
  packageTypeSchema,
  paymentPreferenceSchema,
} from "../domain/validators.js";
import { userFacingPaymentNotesSchema } from "./payment-notes.schema.js";

export const pricingPreviewSchema = z.object({
  selectedPackage: packageTypeSchema,
  additionalI130Count: z.number().int().min(0),
  expedited: z.boolean(),
});

export const agreementPreviewSchema = pricingPreviewSchema.extend({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(5, "Phone is required"),
  caseType: z.string().min(1, "Case type is required"),
  notes: z.string().optional().default(""),
});

export const finalIntakeSchema = agreementPreviewSchema
  .extend({
    petitionRelationship: z.string().trim().min(1, "Petition relationship is required"),
    location: z.string().trim().min(2, "Location/jurisdiction is required").max(200),
    hasUrgentDeadline: z.boolean().default(false),
    urgentDeadlineNotes: z.string().trim().max(2000).optional().default(""),
    consultationType: consultationTypeSchema,
    preferredDateTime: z.string().min(1, "Preferred date/time is required"),
    billingName: z.string().min(1, "Billing name is required"),
    billingEmail: z.email("Valid billing email is required"),
    paymentPreference: paymentPreferenceSchema,
    consentManualProcessing: z.boolean().refine((value) => value === true, {
      message: "Consent to manual processing is required",
    }),
    consentAvailabilityAcknowledgment: z.boolean().refine((value) => value === true, {
      message: "Availability acknowledgment is required",
    }),
    paymentNotes: userFacingPaymentNotesSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.hasUrgentDeadline && !value.urgentDeadlineNotes.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Urgent deadline notes are required when an urgent deadline is indicated",
        path: ["urgentDeadlineNotes"],
      });
    }
  });
