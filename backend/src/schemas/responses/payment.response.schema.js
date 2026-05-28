import { z } from "zod";
import { paymentStatusSchema, uuidSchema } from "../../domain/validators.js";
import { dateLikeSchema } from "./shared.schema.js";

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
