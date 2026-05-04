import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const isProduction = NODE_ENV === "production";

const DEFAULT_AUTH_SECRET = "development-auth-secret-change-me";
const PLACEHOLDER_AUTH_SECRET = "replace-with-a-long-random-secret";
const AUTH_TOKEN_SECRET = process.env.AUTH_TOKEN_SECRET || (isProduction ? "" : DEFAULT_AUTH_SECRET);

if (isProduction && !AUTH_TOKEN_SECRET) {
  throw new Error("AUTH_TOKEN_SECRET must be set in production");
}

if (AUTH_TOKEN_SECRET.length < 32) {
  throw new Error("AUTH_TOKEN_SECRET must be at least 32 characters");
}

if (
  isProduction &&
  [DEFAULT_AUTH_SECRET, PLACEHOLDER_AUTH_SECRET].includes(AUTH_TOKEN_SECRET)
) {
  throw new Error("AUTH_TOKEN_SECRET must not use a default or placeholder value in production");
}

function parseList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const explicitOrigins = parseList(process.env.CORS_ORIGINS);
const fallbackOrigins = isProduction
  ? [process.env.CLIENT_URL].filter(Boolean)
  : [
      process.env.CLIENT_URL || "http://127.0.0.1:5173",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];

const CORS_ORIGINS = explicitOrigins.length ? explicitOrigins : fallbackOrigins;

const env = {
  NODE_ENV,
  isProduction,
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://127.0.0.1:5173",
  BASE_URL: process.env.BASE_URL || "http://127.0.0.1:5000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  CHROMIUM_PATH: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  AUTH_TOKEN_SECRET,
  CORS_ORIGINS,
  LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
  ADMIN_NAME: process.env.ADMIN_NAME || "System Administrator",
};

export default env;
