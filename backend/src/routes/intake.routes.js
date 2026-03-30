import { Router } from "express";
import { createIntakeController } from "../controllers/intake.controller.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { finalIntakeSchema } from "../schemas/intake.schema.js";

const router = Router();

router.post("/", validateRequest(finalIntakeSchema), createIntakeController);

export default router;