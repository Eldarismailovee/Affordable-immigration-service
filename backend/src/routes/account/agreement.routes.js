import { Router } from "express";
import { generateAgreementController } from "../../controllers/agreement.controller.js";
import { getAgreementByLeadController } from "../../controllers/agreement-detail.controller.js";
import { downloadAgreementPdfController } from "../../controllers/agreement-pdf.controller.js";
import { requireLeadAccess } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";
import { agreementPreviewSchema } from "../../schemas/intake.schema.js";

const router = Router();

router.post("/generate", validateRequest(agreementPreviewSchema), generateAgreementController);
router.get(
  "/:leadId/pdf",
  validateRequest({ params: leadIdParamsSchema }),
  requireLeadAccess,
  downloadAgreementPdfController
);
router.get(
  "/:leadId",
  validateRequest({ params: leadIdParamsSchema }),
  requireLeadAccess,
  getAgreementByLeadController
);

export default router;
