import { z } from "zod";

export const cookieConsentLogResponseSchema = z.object({
  ok: z.literal(true),
  id: z.string().uuid(),
});
