import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsConfig } from "./config/cors.js";
import env from "./config/env.js";
import { getCachedReadiness } from "./services/readiness.service.js";
import publicRoutes from "./routes/public/index.js";
import authRoutes from "./routes/auth/index.js";
import accountRoutes from "./routes/account/index.js";
import adminRoutes from "./routes/admin/index.js";
import { optionalAuth, requireAuth, requirePrivilegedMfa, requireVerifiedEmail } from "./middleware/auth.js";
import { auditAdminAction } from "./middleware/auditAdminAction.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { httpLogger } from "./middleware/httpLogger.js";
import { notFound } from "./middleware/notFound.js";
import { generalRateLimit } from "./middleware/rateLimit.js";
import { requestId } from "./middleware/requestId.js";
import { noStoreSensitiveResponses } from "./middleware/noStore.js";

const app = express();

app.set("trust proxy", 1);

app.use(requestId);
app.use(httpLogger);
app.use(noStoreSensitiveResponses);
app.use(
  helmet({
    contentSecurityPolicy: env.isProduction
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            fontSrc: ["'self'", "data:"],
            connectSrc: ["'self'", ...env.CORS_ORIGINS],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: [],
          },
        }
      : false,
    hsts: env.isProduction
      ? {
          maxAge: 31_536_000,
          includeSubDomains: true,
        }
      : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    permissionsPolicy: {
      features: {
        camera: [],
        geolocation: [],
        microphone: [],
        payment: [],
      },
    },
  })
);
app.use(cors(corsConfig));

app.use(express.json({ limit: "1mb" }));
app.use(optionalAuth);
app.use("/api", generalRateLimit);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Backend is running" });
});

app.get("/api/ready", async (_req, res) => {
  const readiness = await getCachedReadiness();
  const statusCode = readiness.ok ? 200 : 503;

  res.status(statusCode).json({
    ok: readiness.ok,
    database: readiness.database,
    migrations: readiness.migrations,
  });
});

app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/account", requireAuth, requireVerifiedEmail, accountRoutes);
app.use(
  "/api/admin",
  requireAuth,
  requireVerifiedEmail,
  requirePrivilegedMfa,
  auditAdminAction,
  adminRoutes
);

app.use(notFound);
app.use(errorHandler);

export default app;
