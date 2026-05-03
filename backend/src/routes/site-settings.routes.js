import { Router } from "express";
import {
  getSiteSettingsController,
  updateSiteSettingsController,
} from "../controllers/site-settings.controller.js";
import { requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", getSiteSettingsController);
router.put("/", requireRole("admin"), updateSiteSettingsController);

export default router;
