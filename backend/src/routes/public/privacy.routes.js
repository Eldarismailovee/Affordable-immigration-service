import { Router } from "express";
import { createPublicPrivacyRequestController } from "../../controllers/public-privacy.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  attachAnonymousActorScope,
  requireIdempotencyKey,
} from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import { createPublicPrivacyRequestSchema } from "../../schemas/dsar.schema.js";

const router = Router();

router.post(
  "/request",
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.DSAR_PUBLIC_CREATE),
  attachAnonymousActorScope("anonymous:public"),
  validateRequest(createPublicPrivacyRequestSchema),
  createPublicPrivacyRequestController
);

export default router;
