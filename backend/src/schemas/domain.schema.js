import { z } from "zod";
import { MAX_IMAGE_UPLOAD_BYTES } from "../constants/domain.js";
import {
  imageUploadMimeTypeSchema,
  uuidSchema,
} from "../domain/validators.js";

export { uuidSchema };

export const leadIdParamsSchema = z.object({
  leadId: uuidSchema,
});

export const userIdParamsSchema = z.object({
  userId: uuidSchema,
});

export const imageUploadFileSchema = z.object({
  fieldname: z.literal("image"),
  originalname: z.string().trim().min(1).max(255),
  mimetype: imageUploadMimeTypeSchema,
  size: z.number().int().positive().max(MAX_IMAGE_UPLOAD_BYTES),
  filename: z.string().min(1).max(255),
  path: z.string().min(1),
});
