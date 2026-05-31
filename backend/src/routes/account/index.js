import { Router } from "express";
import leadsRoutes from "./leads.routes.js";
import intakeRoutes from "./intake.routes.js";
import bookingRoutes from "./booking.routes.js";
import agreementRoutes from "./agreement.routes.js";
import onboardingRoutes from "./onboarding.routes.js";
import dsarRoutes from "./dsar.routes.js";
import emailPreferencesRoutes from "./email-preferences.routes.js";

const router = Router();

router.use("/leads", leadsRoutes);
router.use("/intake", intakeRoutes);
router.use("/booking", bookingRoutes);
router.use("/agreement", agreementRoutes);
router.use("/onboarding", onboardingRoutes);
router.use("/dsar", dsarRoutes);
router.use("/email-preferences", emailPreferencesRoutes);

export default router;
