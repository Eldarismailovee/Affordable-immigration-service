import { Router } from "express";
import {
  getLeadDetailController,
  listLeadsController,
} from "../controllers/admin.controller.js";

const router = Router();

router.get("/leads", listLeadsController);
router.get("/leads/:leadId", getLeadDetailController);

export default router;
