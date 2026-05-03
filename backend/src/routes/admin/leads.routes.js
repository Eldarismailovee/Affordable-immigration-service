import { Router } from "express";
import {
  getLeadDetailController,
  listLeadsController,
} from "../../controllers/admin.controller.js";

const router = Router();

router.get("/", listLeadsController);
router.get("/:leadId", getLeadDetailController);

export default router;
