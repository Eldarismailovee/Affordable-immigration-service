import { Router } from "express";
import {
  confirmEmailVerificationController,
  requestEmailVerificationController,
  resendEmailVerificationPublicController,
} from "../../controllers/email-verification.controller.js";
import { changeEmailController } from "../../controllers/email-change.controller.js";
import {
  requireAuth,
} from "../../middleware/auth.js";
import {
  authRateLimit,
  emailChangeRateLimit,
  emailVerificationRateLimit,
  emailVerificationResendRateLimit,
} from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  changeEmailSchema,
  confirmEmailVerificationSchema,
  resendEmailVerificationSchema,
} from "../../schemas/auth.schema.js";

const router = Router();

router.post(
  "/email/resend",
  emailVerificationResendRateLimit,
  validateRequest(resendEmailVerificationSchema),
  resendEmailVerificationPublicController
);

router.post(
  "/email/verify",
  authRateLimit,
  validateRequest(confirmEmailVerificationSchema),
  confirmEmailVerificationController
);

router.post(
  "/email-verification/request",
  requireAuth,
  emailVerificationRateLimit,
  requestEmailVerificationController
);

router.post(
  "/email-verification/confirm",
  authRateLimit,
  validateRequest(confirmEmailVerificationSchema),
  confirmEmailVerificationController
);

router.post(
  "/email/change",
  requireAuth,
  emailChangeRateLimit,
  validateRequest(changeEmailSchema),
  changeEmailController
);

export default router;
