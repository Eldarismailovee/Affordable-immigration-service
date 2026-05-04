import { Router } from "express";
import { generateOnboardingPacketForLeadController } from "../../controllers/onboarding-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.post(
  "/:leadId/generate",
  validateRequest({ params: leadIdParamsSchema }),
  generateOnboardingPacketForLeadController
);

export default router;
