import { Router } from "express";
import { generateAgreementController } from "../../controllers/agreement.controller.js";
import { getAgreementByLeadController } from "../../controllers/agreement-detail.controller.js";
import { downloadAgreementPdfController } from "../../controllers/agreement-pdf.controller.js";
import { requireLeadAccess } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { agreementPreviewSchema } from "../../schemas/intake.schema.js";

const router = Router();

router.post("/generate", validateRequest(agreementPreviewSchema), generateAgreementController);
router.get("/:leadId/pdf", requireLeadAccess, downloadAgreementPdfController);
router.get("/:leadId", requireLeadAccess, getAgreementByLeadController);

export default router;
