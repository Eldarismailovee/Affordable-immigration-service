import { Router } from "express";
import {
  loginController,
  logoutController,
  refreshController,
} from "../../controllers/session.controller.js";
import { meController } from "../../controllers/auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
} from "../../schemas/auth.schema.js";

const router = Router();

router.post("/login", authRateLimit, validateRequest(loginSchema), loginController);
router.post("/refresh", authRateLimit, validateRequest(refreshTokenSchema), refreshController);
router.post("/logout", validateRequest(logoutSchema), logoutController);
router.get("/me", requireAuth, meController);

export default router;
