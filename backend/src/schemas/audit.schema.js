import { z } from "zod";
import { uuidSchema } from "./domain.schema.js";

export const listAuditEventsQuerySchema = z
  .object({
    eventType: z.string().trim().min(1).max(120).optional(),
    actorUserId: uuidSchema.optional(),
    targetType: z.string().trim().min(1).max(50).optional(),
    targetId: z.string().trim().min(1).max(200).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
  })
  .strict();
