import { Router } from "express";
import { registerController } from "../../controllers/auth.controller.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { registerSchema } from "../../schemas/auth.schema.js";
import emailVerificationRoutes from "./email-verification.routes.js";
import passwordResetRoutes from "./password-reset.routes.js";
import sessionRoutes from "./session.routes.js";

const router = Router();

router.post("/register", authRateLimit, validateRequest(registerSchema), registerController);
router.use(sessionRoutes);
router.use(passwordResetRoutes);
router.use(emailVerificationRoutes);

export default router;
