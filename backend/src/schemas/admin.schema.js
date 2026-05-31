import { z } from "zod";
import {
  leadStatusSchema,
  paymentStatusSchema,
  userRoleSchema,
} from "../domain/validators.js";

export const updateUserRoleSchema = z
  .object({
    role: userRoleSchema,
  })
  .strict();

export const updateLeadStateSchema = z
  .object({
    state: leadStatusSchema,
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const approvePacketSchema = z
  .object({
    reviewNotes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const updatePaymentStatusSchema = z
  .object({
    status: paymentStatusSchema,
  })
  .strict();

export const docketwiseStubSchema = z
  .object({
    email: z.email("Valid email is required").optional(),
  })
  .passthrough();
