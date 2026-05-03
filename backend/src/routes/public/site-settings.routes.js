import { Router } from "express";
import { getSiteSettingsController } from "../../controllers/site-settings.controller.js";

const router = Router();

router.get("/", getSiteSettingsController);

export default router;
