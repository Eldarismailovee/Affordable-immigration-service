import { Router } from "express";
import {
  getSiteSettingsController,
  updateSiteSettingsController,
} from "../controllers/site-settings.controller.js";

const router = Router();

router.get("/", getSiteSettingsController);
router.put("/", updateSiteSettingsController);

export default router;
