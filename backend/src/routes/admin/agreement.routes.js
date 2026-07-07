import { Router } from "express";
import {
  approveAgreementController,
  generateAgreementForLeadController,
} from "../../controllers/agreement-admin.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { requireIdempotencyKey } from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import { approvePacketSchema } from "../../schemas/admin.schema.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();
const adminOnly = requireRole("admin");
const staff = requireRole("admin", "attorney");

router.post(
  "/:leadId/generate",
  staff,
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.AGREEMENT_GENERATE),
  validateRequest({ params: leadIdParamsSchema }),
  generateAgreementForLeadController
);

router.patch(
  "/:leadId/approve",
  staff,
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.AGREEMENT_APPROVE),
  validateRequest({ params: leadIdParamsSchema, body: approvePacketSchema }),
  approveAgreementController
);

export default router;
