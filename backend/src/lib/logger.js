import pino from "pino";
import env from "../config/env.js";

/** Application stdout logs: rotate/archive in infra for TECHNICAL_LOG_RETENTION_DAYS (default 90). */

const transport = env.isProduction
  ? undefined
  : {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: false,
        ignore: "pid,hostname",
      },
    };

export const logger = pino({
  level: env.LOG_LEVEL,
  transport,
});
