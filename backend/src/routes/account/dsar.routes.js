import { Router } from "express";
import {
  createDsarRequestController,
  getDsarExportController,
  getDsarExportPdfController,
  getDsarRequestController,
  listDsarRequestsController,
} from "../../controllers/dsar.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { requireIdempotencyKey } from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import { createDsarRequestSchema, dsarRequestIdParamsSchema } from "../../schemas/dsar.schema.js";

const router = Router();

router.post(
  "/",
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.DSAR_CREATE),
  validateRequest(createDsarRequestSchema),
  createDsarRequestController
);
router.get("/", listDsarRequestsController);
router.get(
  "/:requestId",
  validateRequest({ params: dsarRequestIdParamsSchema }),
  getDsarRequestController
);
router.get(
  "/:requestId/export",
  validateRequest({ params: dsarRequestIdParamsSchema }),
  getDsarExportController
);
router.get(
  "/:requestId/export.pdf",
  validateRequest({ params: dsarRequestIdParamsSchema }),
  getDsarExportPdfController
);

export default router;
