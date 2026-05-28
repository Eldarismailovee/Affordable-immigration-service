import { Router } from "express";
import {
  confirmEmailVerificationController,
  requestEmailVerificationController,
} from "../../controllers/email-verification.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { confirmEmailVerificationSchema } from "../../schemas/auth.schema.js";

const router = Router();

router.post(
  "/email-verification/request",
  requireAuth,
  requestEmailVerificationController
);
router.post(
  "/email-verification/confirm",
  authRateLimit,
  validateRequest(confirmEmailVerificationSchema),
  confirmEmailVerificationController
);

export default router;
