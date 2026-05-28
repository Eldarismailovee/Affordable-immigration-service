import { z } from "zod";
import { packageTypeSchema } from "../../domain/validators.js";

export const pricingResponseSchema = z.object({
  selectedPackage: packageTypeSchema,
  additionalI130Count: z.number().int().min(0),
  expedited: z.boolean(),
  minTotal: z.number().int().min(0),
  maxTotal: z.number().int().min(0),
  filingFeesIncluded: z.boolean(),
});
