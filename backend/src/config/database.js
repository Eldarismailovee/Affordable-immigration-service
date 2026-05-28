import env from "./env.js";

export const databaseConfig = Object.freeze({
  connectionString: env.DATABASE_URL,
  pool: Object.freeze({
    max: env.DB_POOL_MAX,
    min: env.DB_POOL_MIN,
    idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT_MS,
    connectionTimeoutMillis: env.DB_POOL_CONNECTION_TIMEOUT_MS,
    allowExitOnIdle: env.DB_POOL_ALLOW_EXIT_ON_IDLE,
    maxUses: env.DB_POOL_MAX_USES,
    maxLifetimeSeconds: env.DB_POOL_MAX_LIFETIME_SECONDS,
  }),
  applicationName: env.DB_APPLICATION_NAME,
  slowQueryThresholdMs: env.DB_SLOW_QUERY_MS,
  ssl: env.DB_SSL
    ? Object.freeze({
        rejectUnauthorized: env.DB_SSL_REJECT_UNAUTHORIZED,
      })
    : false,
});

export default databaseConfig;
