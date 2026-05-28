import { z } from "zod";

export const bookingCreateResponseSchema = z.object({
  success: z.boolean(),
  consultationType: z.string(),
  durationMinutes: z.number().int().positive(),
  email: z.string().nullable().optional(),
  status: z.string(),
});
