import { Router } from "express";
import { getOnboardingPacketController } from "../controllers/onboarding.controller.js";
import { generateOnboardingPacketForLeadController } from "../controllers/onboarding-admin.controller.js";
import { downloadOnboardingPdfController } from "../controllers/onboarding-pdf.controller.js";

const router = Router();

router.get("/:leadId/pdf", downloadOnboardingPdfController);
router.get("/:leadId", getOnboardingPacketController);
router.post("/:leadId/generate", generateOnboardingPacketForLeadController);

export default router;
