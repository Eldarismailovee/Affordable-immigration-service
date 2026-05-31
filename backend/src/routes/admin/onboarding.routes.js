import { Router } from "express";
import {
  approveOnboardingController,
  generateOnboardingPacketForLeadController,
} from "../../controllers/onboarding-admin.controller.js";
import { requireRole } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { approvePacketSchema } from "../../schemas/admin.schema.js";
import { leadIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();
const adminOnly = requireRole("admin");
const staff = requireRole("admin", "attorney");

router.post(
  "/:leadId/generate",
  adminOnly,
  validateRequest({ params: leadIdParamsSchema }),
  generateOnboardingPacketForLeadController
);

router.patch(
  "/:leadId/approve",
  staff,
  validateRequest({ params: leadIdParamsSchema, body: approvePacketSchema }),
  approveOnboardingController
);

export default router;
