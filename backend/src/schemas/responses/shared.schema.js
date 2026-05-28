import { z } from "zod";
import { uuidSchema } from "../../domain/validators.js";

export const dateLikeSchema = z.union([z.string(), z.date()]);
export const nullableStringSchema = z.string().nullable().optional();
export const nullableNumberSchema = z.number().nullable().optional();

export const nullableEntityByLeadSchema = z
  .object({
    id: uuidSchema,
    lead_id: uuidSchema,
  })
  .passthrough()
  .nullable();
