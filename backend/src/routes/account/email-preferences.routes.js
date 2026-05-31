import { Router } from "express";
import {
  getEmailPreferencesController,
  updateEmailPreferencesController,
} from "../../controllers/email-preferences.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { emailPreferencesSchema } from "../../schemas/email-compliance.schema.js";

const router = Router();

router.get("/", getEmailPreferencesController);
router.patch("/", validateRequest(emailPreferencesSchema), updateEmailPreferencesController);

export default router;
