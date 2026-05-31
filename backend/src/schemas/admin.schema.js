import { z } from "zod";
import {
  leadStatusSchema,
  paymentStatusSchema,
  userRoleSchema,
} from "../domain/validators.js";
import { adminFreeTextNotesSchema } from "./payment-notes.schema.js";

export const updateUserRoleSchema = z
  .object({
    role: userRoleSchema,
  })
  .strict();

export const updateLeadStateSchema = z
  .object({
    state: leadStatusSchema,
    notes: adminFreeTextNotesSchema,
  })
  .strict();

export const approvePacketSchema = z
  .object({
    reviewNotes: adminFreeTextNotesSchema,
  })
  .strict();

export const updatePaymentStatusSchema = z
  .object({
    status: paymentStatusSchema,
  })
  .strict();

export const updateHostedPaymentUrlSchema = z
  .object({
    hostedPaymentUrl: z.string().trim().url("Hosted payment URL must be a valid URL"),
    provider: z.string().trim().max(50).optional(),
    providerReference: z.string().trim().max(200).optional(),
  })
  .strict();

export const docketwiseStubSchema = z
  .object({
    email: z.email("Valid email is required").optional(),
  })
  .passthrough();
