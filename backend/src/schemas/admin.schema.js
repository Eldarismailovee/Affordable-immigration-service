import { z } from "zod";
import { paymentStatusSchema, userRoleSchema } from "./domain.schema.js";

export const updateUserRoleSchema = z
  .object({
    role: userRoleSchema,
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
