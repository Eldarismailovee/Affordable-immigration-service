import { Router } from "express";
import {
  deleteLeadController,
  getLeadDetailController,
  listLeadsController,
} from "../../controllers/admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.get("/", listLeadsController);
router.get("/:leadId", validateRequest({ params: leadIdParamsSchema }), getLeadDetailController);
router.delete("/:leadId", validateRequest({ params: leadIdParamsSchema }), deleteLeadController);

export default router;
