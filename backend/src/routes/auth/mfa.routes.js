import { Router } from "express";
import {
  confirmEnrollmentController,
  disableMfaController,
  regenerateRecoveryCodesController,
  startEnrollmentController,
  stepUpController,
  verifyMfaController,
  getMfaStatusController,
  adminResetMfaController,
} from "../../controllers/mfa.controller.js";
import {
  requireAuth,
  requirePrivilegedMfa,
  requireRole,
  requireStepUp,
} from "../../middleware/auth.js";
import {
  mfaRateLimit,
  mfaSensitiveRateLimit,
} from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { requireIdempotencyKey } from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import {
  mfaAdminResetSchema,
  mfaConfirmEnrollmentSchema,
  mfaDisableSchema,
  mfaRegenerateRecoverySchema,
  mfaStartEnrollmentSchema,
  mfaStepUpSchema,
  mfaVerifySchema,
} from "../../schemas/mfa.schema.js";

const router = Router();

router.post(
  "/verify",
  mfaRateLimit,
  validateRequest(mfaVerifySchema),
  verifyMfaController
);

router.post(
  "/enrollment/start",
  mfaSensitiveRateLimit,
  validateRequest(mfaStartEnrollmentSchema),
  startEnrollmentController
);

router.post(
  "/enrollment/confirm",
  mfaRateLimit,
  validateRequest(mfaConfirmEnrollmentSchema),
  confirmEnrollmentController
);

router.post(
  "/recovery/regenerate",
  requireAuth,
  requirePrivilegedMfa,
  mfaSensitiveRateLimit,
  validateRequest(mfaRegenerateRecoverySchema),
  regenerateRecoveryCodesController
);

router.post(
  "/disable",
  requireAuth,
  mfaSensitiveRateLimit,
  validateRequest(mfaDisableSchema),
  disableMfaController
);

router.post(
  "/step-up",
  requireAuth,
  requirePrivilegedMfa,
  mfaRateLimit,
  validateRequest(mfaStepUpSchema),
  stepUpController
);

router.get("/status", requireAuth, getMfaStatusController);

router.post(
  "/admin/reset",
  requireAuth,
  requireRole("admin"),
  requireStepUp(300),
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.MFA_ADMIN_RESET),
  mfaSensitiveRateLimit,
  validateRequest(mfaAdminResetSchema),
  adminResetMfaController
);

export default router;
