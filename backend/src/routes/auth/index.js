import { Router } from "express";
import {
  confirmEmailVerificationController,
  confirmPasswordResetController,
  loginController,
  logoutController,
  meController,
  refreshController,
  registerController,
  requestEmailVerificationController,
  requestPasswordResetController,
} from "../../controllers/auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  confirmEmailVerificationSchema,
  confirmPasswordResetSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  requestPasswordResetSchema,
} from "../../schemas/auth.schema.js";

const router = Router();

router.post("/register", authRateLimit, validateRequest(registerSchema), registerController);
router.post("/login", authRateLimit, validateRequest(loginSchema), loginController);
router.post("/refresh", authRateLimit, validateRequest(refreshTokenSchema), refreshController);
router.post("/logout", validateRequest(logoutSchema), logoutController);
router.post(
  "/password-reset/request",
  authRateLimit,
  validateRequest(requestPasswordResetSchema),
  requestPasswordResetController
);
router.post(
  "/password-reset/confirm",
  authRateLimit,
  validateRequest(confirmPasswordResetSchema),
  confirmPasswordResetController
);
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
router.get("/me", requireAuth, meController);

export default router;
