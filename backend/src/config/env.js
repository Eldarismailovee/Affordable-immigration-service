import dotenv from "dotenv";
import { z } from "zod";
import {
  SECURITY_AUDIT_RETENTION_DAYS,
  TECHNICAL_LOG_RETENTION_DAYS,
} from "../constants/retention.js";

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

const paymentHostAllowlistSchema = z.preprocess((value) => {
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
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  }

  return normalizedValue;
}, z.array(z.string().trim().min(1)).default([]));

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
  PAYMENT_HOST_ALLOWLIST: paymentHostAllowlistSchema,
  TECHNICAL_LOG_RETENTION_DAYS: integerEnv(
    TECHNICAL_LOG_RETENTION_DAYS,
    z.number().int().min(1).max(3650)
  ),
  SECURITY_AUDIT_RETENTION_DAYS: integerEnv(
    SECURITY_AUDIT_RETENTION_DAYS,
    z.number().int().min(1).max(3650)
  ),
  DOCUMENT_ENCRYPTION_KEY_BASE64: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).optional()
  ),
  DOCKETWISE_API_URL: z.preprocess(emptyToUndefined, z.string().trim().url().optional()),
  DOCKETWISE_API_TOKEN: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  BOOKING_PROVIDER_CONFIGURED: booleanEnv(isTest),
  EMAIL_PROVIDER_CONFIGURED: booleanEnv(isTest),
  MFA_ENCRYPTION_KEY: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
  MFA_ENCRYPTION_KEY_VERSION: stringEnv("v1"),
  MFA_ISSUER: stringEnv("Affordable Immigration Service"),
  MFA_CHALLENGE_TTL_SECONDS: integerEnv(300, z.number().int().min(60).max(900)),
  MFA_STEP_UP_MAX_AGE_SECONDS: integerEnv(300, z.number().int().min(60).max(3600)),
  MFA_MAX_ATTEMPTS: integerEnv(5, z.number().int().min(3).max(20)),
  APP_PUBLIC_URL: stringEnv("http://127.0.0.1:5173").pipe(z.string().url()),
  EMAIL_VERIFICATION_TOKEN_TTL_SECONDS: integerEnv(
    3600,
    z.number().int().min(300).max(86400)
  ),
  EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: integerEnv(
    60,
    z.number().int().min(30).max(3600)
  ),
  EMAIL_VERIFICATION_MAX_SENDS_PER_HOUR: integerEnv(
    5,
    z.number().int().min(1).max(20)
  ),
  EMAIL_VERIFICATION_MAX_VERIFY_ATTEMPTS: integerEnv(
    5,
    z.number().int().min(3).max(20)
  ),
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

if (isProduction && env.PAYMENT_HOST_ALLOWLIST.length === 0) {
  throw new Error("PAYMENT_HOST_ALLOWLIST must be configured in production");
}

if (isProduction && !/^https:\/\//i.test(env.APP_PUBLIC_URL)) {
  throw new Error("APP_PUBLIC_URL must use HTTPS in production");
}

if (isProduction) {
  const mfaKey = env.MFA_ENCRYPTION_KEY;

  if (!mfaKey) {
    throw new Error("MFA_ENCRYPTION_KEY must be set in production");
  }

  try {
    const decoded = Buffer.from(mfaKey, "base64");

    if (decoded.length !== 32) {
      throw new Error("MFA_ENCRYPTION_KEY must decode to 32 bytes");
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "MFA_ENCRYPTION_KEY must be valid base64"
    );
  }
}

export { env };
export default env;
