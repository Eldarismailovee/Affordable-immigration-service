import { Router } from "express";
import { listAuditEventsController } from "../../controllers/audit-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { listAuditEventsQuerySchema } from "../../schemas/audit.schema.js";

const router = Router();

router.get(
  "/",
  validateRequest({ query: listAuditEventsQuerySchema }),
  listAuditEventsController
);

export default router;
