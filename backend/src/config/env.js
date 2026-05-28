import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const DEFAULT_AUTH_SECRET = "development-auth-secret-change-me";
const PLACEHOLDER_AUTH_SECRET = "replace-with-a-long-random-secret";
const TEST_DATABASE_URL = "postgresql://test:test@127.0.0.1:5432/test";

const rawNodeEnv = process.env.NODE_ENV || "development";
const isProduction = rawNodeEnv === "production";
const isTest = rawNodeEnv === "test";

function emptyToUndefined(value) {
  return value === "" || value === null ? undefined : value;
}

function integerEnv(defaultValue, schema = z.number().int()) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().pipe(schema).default(defaultValue)
  );
}

function booleanEnv(defaultValue) {
  return z.preprocess((value) => {
    const normalizedValue = emptyToUndefined(value);

    if (normalizedValue === undefined || typeof normalizedValue === "boolean") {
      return normalizedValue;
    }

    if (typeof normalizedValue === "string") {
      const normalized = normalizedValue.trim().toLowerCase();

      if (["true", "1", "yes", "on"].includes(normalized)) {
        return true;
      }

      if (["false", "0", "no", "off"].includes(normalized)) {
        return false;
      }
    }

    return normalizedValue;
  }, z.boolean().default(defaultValue));
}

function stringEnv(defaultValue) {
  return z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).default(defaultValue)
  );
}

const authTokenSecretSchema = z
  .preprocess(emptyToUndefined, z.string().optional())
  .transform((value) => value || (isProduction ? "" : DEFAULT_AUTH_SECRET))
  .superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AUTH_TOKEN_SECRET must be set",
      });
      return;
    }

    if (value.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AUTH_TOKEN_SECRET must be at least 32 characters",
      });
    }

    if (
      isProduction &&
      [DEFAULT_AUTH_SECRET, PLACEHOLDER_AUTH_SECRET].includes(value)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "AUTH_TOKEN_SECRET must not use a default or placeholder value in production",
      });
    }
  });

const postgresUrlSchema = z
  .string()
  .trim()
  .min(1, "DATABASE_URL must be set")
  .regex(/^postgres(?:ql)?:\/\//, "DATABASE_URL must be a PostgreSQL connection URL");

const databaseUrlSchema = z.preprocess(
  emptyToUndefined,
  isTest ? postgresUrlSchema.default(TEST_DATABASE_URL) : postgresUrlSchema
);

const optionalEmailSchema = z
  .preprocess(emptyToUndefined, z.string().trim().email().optional())
  .transform((value) => value || "");

const optionalPasswordSchema = z
  .preprocess(emptyToUndefined, z.string().min(12).optional())
  .transform((value) => value || "");

const corsOriginsSchema = z.preprocess((value) => {
  const normalizedValue = emptyToUndefined(value);

  if (normalizedValue === undefined) {
    return [];
  }

  if (Array.isArray(normalizedValue)) {
    return normalizedValue;
  }

  if (typeof normalizedValue === "string") {
    return normalizedValue
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return normalizedValue;
}, z.array(z.string().trim().url()).default([]));

const rawEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: integerEnv(5000, z.number().int().min(1).max(65535)),
  CLIENT_URL: stringEnv("http://127.0.0.1:5173").pipe(z.string().url()),
  BASE_URL: stringEnv("http://127.0.0.1:5000").pipe(z.string().url()),
  DATABASE_URL: databaseUrlSchema,
  CHROMIUM_PATH: stringEnv("/usr/bin/chromium"),
  AUTH_TOKEN_SECRET: authTokenSecretSchema,
  CORS_ORIGINS: corsOriginsSchema,
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default(isProduction ? "info" : "debug"),
  ADMIN_EMAIL: optionalEmailSchema,
  ADMIN_PASSWORD: optionalPasswordSchema,
  ADMIN_NAME: stringEnv("System Administrator"),
  DB_POOL_MAX: integerEnv(10, z.number().int().min(1)),
  DB_POOL_MIN: integerEnv(0, z.number().int().min(0)),
  DB_POOL_IDLE_TIMEOUT_MS: integerEnv(10000, z.number().int().min(0)),
  DB_POOL_CONNECTION_TIMEOUT_MS: integerEnv(5000, z.number().int().min(1)),
  DB_POOL_MAX_LIFETIME_SECONDS: integerEnv(0, z.number().int().min(0)),
  DB_POOL_MAX_USES: integerEnv(0, z.number().int().min(0)),
  DB_POOL_ALLOW_EXIT_ON_IDLE: booleanEnv(false),
  DB_APPLICATION_NAME: stringEnv("affordable-immigration-service"),
  DB_SLOW_QUERY_MS: integerEnv(250, z.number().int().min(1)),
  DB_SSL: booleanEnv(isProduction),
  DB_SSL_REJECT_UNAUTHORIZED: booleanEnv(isProduction),
  UPLOAD_STORAGE_DRIVER: z.enum(["local"]).default("local"),
  UPLOAD_VIRUS_SCAN_ENABLED: booleanEnv(false),
  UPLOAD_VIRUS_SCAN_COMMAND: stringEnv("clamdscan"),
  UPLOAD_VIRUS_SCAN_TIMEOUT_MS: integerEnv(10000, z.number().int().min(1000)),
});

const parsedEnv = rawEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const messages = parsedEnv.error.issues.map((issue) => {
    const path = issue.path.join(".") || "env";
    return `${path}: ${issue.message}`;
  });

  throw new Error(`Invalid environment configuration:\n${messages.join("\n")}`);
}

const validatedEnv = parsedEnv.data;
const explicitOrigins = validatedEnv.CORS_ORIGINS;
const fallbackOrigins = isProduction
  ? [validatedEnv.CLIENT_URL]
  : [
      validatedEnv.CLIENT_URL,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ];

const env = Object.freeze({
  ...validatedEnv,
  isProduction,
  isTest,
  CORS_ORIGINS: explicitOrigins.length ? explicitOrigins : fallbackOrigins,
});

export { env };
export default env;
