import { Router } from "express";
import {
  updateHostedPaymentUrlController,
  updatePaymentStatusController,
} from "../../controllers/payment-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { requireIdempotencyKey } from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import {
  updateHostedPaymentUrlSchema,
  updatePaymentStatusSchema,
} from "../../schemas/admin.schema.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.patch(
  "/:leadId/status",
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.PAYMENT_STATUS),
  validateRequest({ params: leadIdParamsSchema, body: updatePaymentStatusSchema }),
  updatePaymentStatusController
);

router.patch(
  "/:leadId/hosted-url",
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.PAYMENT_HOSTED_URL),
  validateRequest({ params: leadIdParamsSchema, body: updateHostedPaymentUrlSchema }),
  updateHostedPaymentUrlController
);

export default router;
