import { Router } from "express";
import leadsRoutes from "./leads.routes.js";
import usersRoutes from "./users.routes.js";
import agreementRoutes from "./agreement.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import docketwiseRoutes from "./docketwise.routes.js";
import paymentsRoutes from "./payments.routes.js";
import siteSettingsRoutes from "./site-settings.routes.js";
import uploadsRoutes from "./uploads.routes.js";
import dsarRoutes from "./dsar.routes.js";
import auditRoutes from "./audit.routes.js";
import { requireRole } from "../../middleware/auth.js";

const router = Router();
const adminOnly = requireRole("admin");
const staff = requireRole("admin", "attorney");

router.use("/leads", staff, leadsRoutes);
router.use("/users", adminOnly, usersRoutes);
router.use("/agreement", agreementRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/docketwise", adminOnly, docketwiseRoutes);
router.use("/payments", adminOnly, paymentsRoutes);
router.use("/site-settings", adminOnly, siteSettingsRoutes);
router.use("/uploads", adminOnly, uploadsRoutes);
router.use("/dsar", dsarRoutes);
router.use("/audit-events", adminOnly, auditRoutes);

export default router;
