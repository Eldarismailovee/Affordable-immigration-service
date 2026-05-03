import { Router } from "express";
import {
  deleteLeadController,
  getLeadDetailController,
  listLeadsController,
} from "../../controllers/admin.controller.js";

const router = Router();

router.get("/", listLeadsController);
router.get("/:leadId", getLeadDetailController);
router.delete("/:leadId", deleteLeadController);

export default router;
