import { Router } from "express";
import { generateAgreementController } from "../../controllers/agreement.controller.js";
import { getAgreementByLeadController } from "../../controllers/agreement-detail.controller.js";
import { downloadAgreementPdfController } from "../../controllers/agreement-pdf.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";
import { agreementPreviewSchema } from "../../schemas/intake.schema.js";

const router = Router();

router.post("/generate", validateRequest(agreementPreviewSchema), generateAgreementController);
router.get(
  "/:leadId/pdf",
  validateRequest({ params: leadIdParamsSchema }),
  downloadAgreementPdfController
);
router.get(
  "/:leadId",
  validateRequest({ params: leadIdParamsSchema }),
  getAgreementByLeadController
);

export default router;
