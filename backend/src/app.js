import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import env from "./config/env.js";
import pricingRoutes from "./routes/pricing.routes.js";
import intakeRoutes from "./routes/intake.routes.js";
import agreementRoutes from "./routes/agreement.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import docketwiseRoutes from "./routes/docketwise.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import onboardingRoutes from "./routes/onboarding.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import siteSettingsRoutes from "./routes/site-settings.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [env.CLIENT_URL, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean),
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

app.use("/api/pricing", pricingRoutes);
app.use("/api/intake", intakeRoutes);
app.use("/api/agreement", agreementRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/docketwise", docketwiseRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/site-settings", siteSettingsRoutes);
app.use("/api/uploads", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
