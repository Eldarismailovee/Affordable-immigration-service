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

export const finalIntakeSchema = agreementPreviewSchema.extend({
  consultationType: consultationTypeSchema,
  preferredDateTime: z.string().min(1, "Preferred date/time is required"),
  billingName: z.string().min(1, "Billing name is required"),
  billingEmail: z.email("Valid billing email is required"),
  paymentPreference: paymentPreferenceSchema,
  consentManualProcessing: z.boolean().refine((value) => value === true, {
    message: "Consent to manual processing is required",
  }),
  paymentNotes: userFacingPaymentNotesSchema,
});
