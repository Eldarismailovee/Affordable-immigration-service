import { Router } from "express";
import cookieConsentRoutes from "./cookie-consent.routes.js";
import pricingRoutes from "./pricing.routes.js";
import siteSettingsRoutes from "./site-settings.routes.js";
import uploadsRoutes from "./uploads.routes.js";
import availabilityRoutes from "./availability.routes.js";
import privacyRoutes from "./privacy.routes.js";
import unsubscribeRoutes from "./unsubscribe.routes.js";

const router = Router();

router.use("/cookie-consent", cookieConsentRoutes);
router.use("/pricing", pricingRoutes);
router.use("/site-settings", siteSettingsRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/", availabilityRoutes);
router.use("/privacy", privacyRoutes);
router.use("/unsubscribe", unsubscribeRoutes);

export default router;
