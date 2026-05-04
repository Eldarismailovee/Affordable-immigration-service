import { Router } from "express";
import { updateSiteSettingsController } from "../../controllers/site-settings.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateSiteSettingsSchema } from "../../schemas/site-settings.schema.js";

const router = Router();

router.put("/", validateRequest(updateSiteSettingsSchema), updateSiteSettingsController);

export default router;
