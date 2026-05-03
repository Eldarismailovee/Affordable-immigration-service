import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import env from "./config/env.js";
import publicRoutes from "./routes/public/index.js";
import authRoutes from "./routes/auth/index.js";
import accountRoutes from "./routes/account/index.js";
import adminRoutes from "./routes/admin/index.js";
import { optionalAuth, requireAuth, requireRole } from "./middleware/auth.js";
import { auditAdminAction } from "./middleware/auditAdminAction.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { httpLogger } from "./middleware/httpLogger.js";
import { notFound } from "./middleware/notFound.js";
import { generalRateLimit } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");

app.set("trust proxy", 1);

app.use(requestId);
app.use(httpLogger);
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGINS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use(optionalAuth);
app.use("/api", generalRateLimit);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", requireAuth, accountRoutes);
app.use("/api/admin", requireRole("admin"), auditAdminAction, adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
