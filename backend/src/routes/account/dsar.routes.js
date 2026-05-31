import { Router } from "express";
import {
  createDsarRequestController,
  getDsarExportController,
  getDsarRequestController,
  listDsarRequestsController,
} from "../../controllers/dsar.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createDsarRequestSchema, dsarRequestIdParamsSchema } from "../../schemas/dsar.schema.js";

const router = Router();

router.post("/", validateRequest(createDsarRequestSchema), createDsarRequestController);
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

export default router;
