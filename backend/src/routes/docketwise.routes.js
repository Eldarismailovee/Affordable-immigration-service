import { Router } from "express";
import { createDocketwiseController } from "../controllers/docketwise.controller.js";
import { syncLeadToDocketwiseController } from "../controllers/docketwise-admin.controller.js";

const router = Router();

router.post("/intake", createDocketwiseController);
router.post("/:leadId/sync", syncLeadToDocketwiseController);

export default router;
