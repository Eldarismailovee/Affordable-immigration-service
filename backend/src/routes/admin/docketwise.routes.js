import { Router } from "express";
import { createDocketwiseController } from "../../controllers/docketwise.controller.js";
import { syncLeadToDocketwiseController } from "../../controllers/docketwise-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { docketwiseStubSchema } from "../../schemas/admin.schema.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.post("/intake", validateRequest(docketwiseStubSchema), createDocketwiseController);
router.post(
  "/:leadId/sync",
  validateRequest({ params: leadIdParamsSchema }),
  syncLeadToDocketwiseController
);

export default router;
