import { z } from "zod";
import { languageModeSchema } from "../domain/validators.js";

const textField = (max = 500) => z.string().trim().max(max);
const imagePathField = z.string().trim().max(2048);

export const updateSiteSettingsSchema = z
  .object({
    firm_name: textField(160).min(1).optional(),
    phone: textField(60).min(1).optional(),
    email: z.email("Valid email is required").optional(),
    office_mode: textField(160).min(1).optional(),
    address: textField(500).optional(),
    logo_url: imagePathField.optional(),
    hero_image_url: imagePathField.optional(),
    services_image_url: imagePathField.optional(),
    office_image_url: imagePathField.optional(),
    language_mode: languageModeSchema.optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one setting is required",
  });
