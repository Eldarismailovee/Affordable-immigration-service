import { listAdminAuditEvents } from "../services/audit.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { z } from "zod";

const auditEventsListResponseSchema = z
  .object({
    events: z.array(
      z
        .object({
          id: z.uuid(),
          eventType: z.string(),
          category: z.string(),
          action: z.string(),
          result: z.string(),
          actorUserId: z.uuid().nullable(),
          actorRole: z.string().nullable(),
          targetType: z.string().nullable(),
          targetId: z.string().nullable(),
          requestId: z.string().nullable(),
          ipHash: z.string().nullable(),
          userAgent: z.string().nullable(),
          reasonCode: z.string().nullable(),
          metadata: z.record(z.string(), z.unknown()),
          createdAt: z.coerce.date(),
        })
        .strict()
    ),
  })
  .strict();

export const listAuditEventsController = asyncHandler(async (req, res) => {
  const events = await listAdminAuditEvents(req.query);
  sendResponse(res, auditEventsListResponseSchema, { events });
});
