import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || "http://127.0.0.1:5173",
  BASE_URL: process.env.BASE_URL || "http://127.0.0.1:5000",
  DATABASE_URL: process.env.DATABASE_URL || "",
  CHROMIUM_PATH: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
};

export default env;
