import { z } from "zod";

export const agreementPreviewSchema = z.object({
  selectedPackage: z.enum(["guidance", "filing"]),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Valid email is required"),
  phone: z.string().min(5, "Phone is required"),
  caseType: z.string().min(1, "Case type is required"),
  notes: z.string().optional().default(""),
  additionalI130Count: z.number().int().min(0),
  expedited: z.boolean(),
});

export const finalIntakeSchema = agreementPreviewSchema.extend({
  consultationType: z.enum(["Zoom", "Phone"]),
  preferredDateTime: z.string().min(1, "Preferred date/time is required"),
  billingName: z.string().min(1, "Billing name is required"),
  billingEmail: z.email("Valid billing email is required"),
  paymentPreference: z.enum(["invoice", "office_call", "manual_follow_up"]),
  consentManualProcessing: z.boolean().refine((value) => value === true, {
    message: "Consent to manual processing is required",
  }),
  paymentNotes: z.string().optional().default(""),
});
