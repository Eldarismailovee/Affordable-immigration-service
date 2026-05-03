import { Router } from "express";
import { getOnboardingPacketController } from "../../controllers/onboarding.controller.js";
import { downloadOnboardingPdfController } from "../../controllers/onboarding-pdf.controller.js";
import { requireLeadAccess } from "../../middleware/auth.js";

const router = Router();

router.get("/:leadId/pdf", requireLeadAccess, downloadOnboardingPdfController);
router.get("/:leadId", requireLeadAccess, getOnboardingPacketController);

export default router;
