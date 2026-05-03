import { Router } from "express";
import { listAccountLeadsController } from "../controllers/account.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/leads", listAccountLeadsController);

export default router;
