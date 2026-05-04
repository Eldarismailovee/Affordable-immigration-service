import { Router } from "express";
import { generateAgreementForLeadController } from "../../controllers/agreement-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.post(
  "/:leadId/generate",
  validateRequest({ params: leadIdParamsSchema }),
  generateAgreementForLeadController
);

export default router;
