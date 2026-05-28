import { z } from "zod";
import { languageModeSchema, uuidSchema } from "../../domain/validators.js";
import { dateLikeSchema } from "./shared.schema.js";

export const siteSettingsResponseSchema = z.object({
  settings: z
    .object({
      id: uuidSchema,
      firm_name: z.string(),
      phone: z.string(),
      email: z.email(),
      office_mode: z.string(),
      language_mode: languageModeSchema,
      updated_at: dateLikeSchema,
    })
    .passthrough(),
});
