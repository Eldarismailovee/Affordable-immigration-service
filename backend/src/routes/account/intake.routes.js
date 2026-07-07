import { Router } from "express";
import { createIntakeController } from "../../controllers/intake.controller.js";
import {
  deleteIntakeDraftController,
  getIntakeDraftController,
  upsertIntakeDraftController,
} from "../../controllers/intake-draft.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { requireIdempotencyKey } from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import { finalIntakeSchema } from "../../schemas/intake.schema.js";
import { intakeDraftUpsertSchema } from "../../schemas/intake-draft.schema.js";

const router = Router();

router.get("/draft", getIntakeDraftController);
router.put("/draft", validateRequest(intakeDraftUpsertSchema), upsertIntakeDraftController);
router.delete("/draft", deleteIntakeDraftController);

router.post(
  "/",
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.INTAKE_CREATE),
  validateRequest(finalIntakeSchema),
  createIntakeController
);

export default router;
