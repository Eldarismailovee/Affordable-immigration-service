import { Router } from "express";
import leadsRoutes from "./leads.routes.js";
import usersRoutes from "./users.routes.js";
import agreementRoutes from "./agreement.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import docketwiseRoutes from "./docketwise.routes.js";
import paymentsRoutes from "./payments.routes.js";
import siteSettingsRoutes from "./site-settings.routes.js";
import uploadsRoutes from "./uploads.routes.js";

const router = Router();

router.use("/leads", leadsRoutes);
router.use("/users", usersRoutes);
router.use("/agreement", agreementRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/docketwise", docketwiseRoutes);
router.use("/payments", paymentsRoutes);
router.use("/site-settings", siteSettingsRoutes);
router.use("/uploads", uploadsRoutes);

export default router;
