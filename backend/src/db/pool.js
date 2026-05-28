import pg from "pg";
import { databaseConfig } from "../config/database.js";
import { logger } from "../lib/logger.js";

const { Pool } = pg;

const poolConfig = {
  connectionString: databaseConfig.connectionString,
  max: databaseConfig.pool.max,
  min: databaseConfig.pool.min,
  idleTimeoutMillis: databaseConfig.pool.idleTimeoutMillis,
  connectionTimeoutMillis: databaseConfig.pool.connectionTimeoutMillis,
  allowExitOnIdle: databaseConfig.pool.allowExitOnIdle,
  application_name: databaseConfig.applicationName,
  ssl: databaseConfig.ssl,
};

if (databaseConfig.pool.maxUses > 0) {
  poolConfig.maxUses = databaseConfig.pool.maxUses;
}

if (databaseConfig.pool.maxLifetimeSeconds > 0) {
  poolConfig.maxLifetimeSeconds = databaseConfig.pool.maxLifetimeSeconds;
}

const pool = new Pool(poolConfig);

pool.on("error", (error) => {
  logger.error({ err: error }, "Unexpected database pool error");
});

export default pool;
