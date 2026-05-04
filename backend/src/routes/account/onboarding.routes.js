import { Router } from "express";
import { getOnboardingPacketController } from "../../controllers/onboarding.controller.js";
import { downloadOnboardingPdfController } from "../../controllers/onboarding-pdf.controller.js";
import { requireLeadAccess } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.get(
  "/:leadId/pdf",
  validateRequest({ params: leadIdParamsSchema }),
  requireLeadAccess,
  downloadOnboardingPdfController
);
router.get(
  "/:leadId",
  validateRequest({ params: leadIdParamsSchema }),
  requireLeadAccess,
  getOnboardingPacketController
);

export default router;
