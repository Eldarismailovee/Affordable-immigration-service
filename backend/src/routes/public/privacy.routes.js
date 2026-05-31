import { Router } from "express";
import { createPublicPrivacyRequestController } from "../../controllers/public-privacy.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { createPublicPrivacyRequestSchema } from "../../schemas/dsar.schema.js";

const router = Router();

router.post(
  "/request",
  validateRequest(createPublicPrivacyRequestSchema),
  createPublicPrivacyRequestController
);

export default router;
