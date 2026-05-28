import { z } from "zod";

export const uploadImageResponseSchema = z.object({
  message: z.string(),
  file: z
    .object({
      filename: z.string(),
      originalName: z.string(),
      mimeType: z.string(),
      detectedMimeType: z.string().optional(),
      size: z.number(),
      url: z.string(),
      path: z.string(),
    })
    .passthrough(),
});
