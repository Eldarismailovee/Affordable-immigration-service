import { Router } from "express";
import pricingRoutes from "./pricing.routes.js";
import siteSettingsRoutes from "./site-settings.routes.js";

const router = Router();

router.use("/pricing", pricingRoutes);
router.use("/site-settings", siteSettingsRoutes);

export default router;
