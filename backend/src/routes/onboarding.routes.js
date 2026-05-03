import { Router } from "express";
import { getOnboardingPacketController } from "../controllers/onboarding.controller.js";
import { generateOnboardingPacketForLeadController } from "../controllers/onboarding-admin.controller.js";
import { downloadOnboardingPdfController } from "../controllers/onboarding-pdf.controller.js";
import { requireLeadAccess, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/:leadId/pdf", requireLeadAccess, downloadOnboardingPdfController);
router.get("/:leadId", requireLeadAccess, getOnboardingPacketController);
router.post("/:leadId/generate", requireRole("admin"), generateOnboardingPacketForLeadController);

export default router;
