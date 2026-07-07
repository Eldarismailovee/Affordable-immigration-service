import { Router } from "express";
import {
  retentionAdminActionController,
  runRetentionJobsController,
} from "../../controllers/retention-admin.controller.js";
import { requireRole, requireStepUp } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { requireIdempotencyKey } from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import {
  retentionAdminActionSchema,
  runRetentionJobsSchema,
} from "../../schemas/retention.schema.js";

const router = Router();
const adminOnly = requireRole("admin");

router.post(
  "/run",
  adminOnly,
  requireStepUp(600),
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.RETENTION_RUN),
  validateRequest({ body: runRetentionJobsSchema }),
  runRetentionJobsController
);

router.post(
  "/actions",
  adminOnly,
  requireStepUp(600),
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.RETENTION_ACTION),
  validateRequest({ body: retentionAdminActionSchema }),
  retentionAdminActionController
);

export default router;
