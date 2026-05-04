import pg from "pg";
import env from "../config/env.js";

const { Pool } = pg;

const poolConfig = {
  connectionString: env.DATABASE_URL,
  max: Math.max(1, env.DB_POOL_MAX),
  min: Math.max(0, env.DB_POOL_MIN),
  idleTimeoutMillis: Math.max(0, env.DB_POOL_IDLE_TIMEOUT_MS),
  connectionTimeoutMillis: Math.max(0, env.DB_POOL_CONNECTION_TIMEOUT_MS),
  allowExitOnIdle: env.DB_POOL_ALLOW_EXIT_ON_IDLE,
  application_name: env.DB_APPLICATION_NAME,
  ssl: env.DB_SSL
    ? {
        rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
      }
    : false,
};

if (env.DB_POOL_MAX_USES > 0) {
  poolConfig.maxUses = env.DB_POOL_MAX_USES;
}

if (env.DB_POOL_MAX_LIFETIME_SECONDS > 0) {
  poolConfig.maxLifetimeSeconds = env.DB_POOL_MAX_LIFETIME_SECONDS;
}

const pool = new Pool(poolConfig);

export default pool;
