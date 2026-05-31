import { Router } from "express";
import {
  deleteLeadController,
  getLeadDetailController,
  listLeadsController,
  updateLeadStateController,
} from "../../controllers/admin.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateLeadStateSchema } from "../../schemas/admin.schema.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();
const adminOnly = requireRole("admin");

router.get("/", listLeadsController);
router.get("/:leadId", validateRequest({ params: leadIdParamsSchema }), getLeadDetailController);
router.patch(
  "/:leadId/state",
  validateRequest({ params: leadIdParamsSchema, body: updateLeadStateSchema }),
  updateLeadStateController
);
router.delete(
  "/:leadId",
  adminOnly,
  validateRequest({ params: leadIdParamsSchema }),
  deleteLeadController
);

export default router;
