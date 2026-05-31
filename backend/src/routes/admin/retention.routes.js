import { Router } from "express";
import {
  retentionAdminActionController,
  runRetentionJobsController,
} from "../../controllers/retention-admin.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  retentionAdminActionSchema,
  runRetentionJobsSchema,
} from "../../schemas/retention.schema.js";

const router = Router();
const adminOnly = requireRole("admin");

router.post(
  "/run",
  adminOnly,
  validateRequest({ body: runRetentionJobsSchema }),
  runRetentionJobsController
);

router.post(
  "/actions",
  adminOnly,
  validateRequest({ body: retentionAdminActionSchema }),
  retentionAdminActionController
);

export default router;
