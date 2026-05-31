import { Router } from "express";
import {
  getUnsubscribeController,
  postUnsubscribeController,
} from "../../controllers/unsubscribe.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { unsubscribeSchema } from "../../schemas/email-compliance.schema.js";

const router = Router();

router.post("/", validateRequest(unsubscribeSchema), postUnsubscribeController);
router.get("/:token", getUnsubscribeController);

export default router;
