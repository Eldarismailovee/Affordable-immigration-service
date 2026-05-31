import { Router } from "express";
import {
  deleteLeadController,
  getLeadDetailController,
  listLeadsController,
} from "../../controllers/admin.controller.js";
import {
  approveLegalRecommendationController,
  getConflictCheckController,
  submitAttorneyReviewController,
  submitConflictCheckController,
  updateConflictCheckController,
  updateLeadStateWithReasonController,
} from "../../controllers/lead-workflow.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateLeadStateSchema } from "../../schemas/admin.schema.js";
import {
  approveLegalRecommendationSchema,
  attorneyReviewSchema,
  submitConflictCheckSchema,
  updateConflictCheckSchema,
} from "../../schemas/lead-workflow.schema.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();
const adminOnly = requireRole("admin");

router.get("/", listLeadsController);
router.get("/:leadId", validateRequest({ params: leadIdParamsSchema }), getLeadDetailController);
router.get(
  "/:leadId/conflict-check",
  validateRequest({ params: leadIdParamsSchema }),
  getConflictCheckController
);
router.post(
  "/:leadId/conflict-check",
  validateRequest({ params: leadIdParamsSchema, body: submitConflictCheckSchema }),
  submitConflictCheckController
);
router.patch(
  "/:leadId/conflict-check",
  validateRequest({ params: leadIdParamsSchema, body: updateConflictCheckSchema }),
  updateConflictCheckController
);
router.post(
  "/:leadId/attorney-review",
  validateRequest({ params: leadIdParamsSchema, body: attorneyReviewSchema }),
  submitAttorneyReviewController
);
router.post(
  "/:leadId/legal-recommendation/approve",
  validateRequest({ params: leadIdParamsSchema, body: approveLegalRecommendationSchema }),
  approveLegalRecommendationController
);
router.patch(
  "/:leadId/state",
  validateRequest({ params: leadIdParamsSchema, body: updateLeadStateSchema }),
  updateLeadStateWithReasonController
);
router.delete(
  "/:leadId",
  adminOnly,
  validateRequest({ params: leadIdParamsSchema }),
  deleteLeadController
);

export default router;
