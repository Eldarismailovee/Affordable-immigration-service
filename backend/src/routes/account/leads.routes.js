import { Router } from "express";
import { listAccountLeadsController } from "../../controllers/account.controller.js";

const router = Router();

router.get("/", listAccountLeadsController);

export default router;
