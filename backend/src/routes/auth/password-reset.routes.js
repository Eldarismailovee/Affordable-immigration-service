import { Router } from "express";
import {
  confirmPasswordResetController,
  requestPasswordResetController,
} from "../../controllers/password-reset.controller.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  confirmPasswordResetSchema,
  requestPasswordResetSchema,
} from "../../schemas/auth.schema.js";

const router = Router();

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

export default router;
