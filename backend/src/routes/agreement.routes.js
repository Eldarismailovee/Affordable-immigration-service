import { Router } from "express";
import { generateAgreementController } from "../controllers/agreement.controller.js";
import { getAgreementByLeadController } from "../controllers/agreement-detail.controller.js";
import { generateAgreementForLeadController } from "../controllers/agreement-admin.controller.js";
import { downloadAgreementPdfController } from "../controllers/agreement-pdf.controller.js";
import { requireAuth, requireLeadAccess, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { agreementPreviewSchema } from "../schemas/intake.schema.js";

const router = Router();

router.post("/generate", requireAuth, validateRequest(agreementPreviewSchema), generateAgreementController);
router.get("/:leadId/pdf", requireLeadAccess, downloadAgreementPdfController);
router.get("/:leadId", requireLeadAccess, getAgreementByLeadController);
router.post("/:leadId/generate", requireRole("admin"), generateAgreementForLeadController);

export default router;
