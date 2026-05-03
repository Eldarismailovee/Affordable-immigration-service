import { Router } from "express";
import {
  loginController,
  meController,
  registerController,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateRequest(registerSchema), registerController);
router.post("/login", validateRequest(loginSchema), loginController);
router.get("/me", requireAuth, meController);

export default router;
