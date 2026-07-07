import { Router } from "express";
import { listAuditEventsController } from "../../controllers/audit-admin.controller.js";
import { requireStepUp } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { listAuditEventsQuerySchema } from "../../schemas/audit.schema.js";

const router = Router();

router.get(
  "/",
  requireStepUp(600),
  validateRequest({ query: listAuditEventsQuerySchema }),
  listAuditEventsController
);

export default router;
