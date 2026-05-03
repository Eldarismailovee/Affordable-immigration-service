import { Router } from "express";
import { generateAgreementForLeadController } from "../../controllers/agreement-admin.controller.js";

const router = Router();

router.post("/:leadId/generate", generateAgreementForLeadController);

export default router;
