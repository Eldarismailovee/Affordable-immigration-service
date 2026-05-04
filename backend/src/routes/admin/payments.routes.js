import { Router } from "express";
import { updatePaymentStatusController } from "../../controllers/payment-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updatePaymentStatusSchema } from "../../schemas/admin.schema.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.patch(
  "/:leadId/status",
  validateRequest({ params: leadIdParamsSchema, body: updatePaymentStatusSchema }),
  updatePaymentStatusController
);

export default router;
