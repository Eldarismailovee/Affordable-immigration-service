import { Router } from "express";
import { updateSiteSettingsController } from "../../controllers/site-settings.controller.js";

const router = Router();

router.put("/", updateSiteSettingsController);

export default router;
