import { Router } from "express";
import { getOnboardingPacketController } from "../../controllers/onboarding.controller.js";
import { downloadOnboardingPdfController } from "../../controllers/onboarding-pdf.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.get(
  "/:leadId/pdf",
  validateRequest({ params: leadIdParamsSchema }),
  downloadOnboardingPdfController
);
router.get(
  "/:leadId",
  validateRequest({ params: leadIdParamsSchema }),
  getOnboardingPacketController
);

export default router;
