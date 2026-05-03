import dotenv from "dotenv";

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://127.0.0.1:5173",
  BASE_URL: process.env.BASE_URL || "http://127.0.0.1:5000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  CHROMIUM_PATH: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET || "development-auth-secret-change-me",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || "",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
  ADMIN_NAME: process.env.ADMIN_NAME || "System Administrator",
};

export default env;
