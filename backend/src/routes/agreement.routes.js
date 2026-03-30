import { Router } from "express";
import { generateAgreementController } from "../controllers/agreement.controller.js";
import { getAgreementByLeadController } from "../controllers/agreement-detail.controller.js";
import { generateAgreementForLeadController } from "../controllers/agreement-admin.controller.js";
import { downloadAgreementPdfController } from "../controllers/agreement-pdf.controller.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { agreementPreviewSchema } from "../schemas/intake.schema.js";

const router = Router();

router.post("/generate", validateRequest(agreementPreviewSchema), generateAgreementController);
router.get("/:leadId/pdf", downloadAgreementPdfController);
router.get("/:leadId", getAgreementByLeadController);
router.post("/:leadId/generate", generateAgreementForLeadController);

export default router;
