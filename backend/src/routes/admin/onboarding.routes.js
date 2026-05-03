import { Router } from "express";
import { generateOnboardingPacketForLeadController } from "../../controllers/onboarding-admin.controller.js";

const router = Router();

router.post("/:leadId/generate", generateOnboardingPacketForLeadController);

export default router;
