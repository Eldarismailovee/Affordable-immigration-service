import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

export const generalRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
});

export const authRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts, please try again later" },
});

export const mfaRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 15,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.body?.challengeToken || ipKeyGenerator(req.ip),
  message: { message: "Too many MFA attempts, please try again later" },
});

export const mfaSensitiveRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) =>
    req.user?.id || req.body?.challengeToken || ipKeyGenerator(req.ip),
  message: { message: "Too many sensitive MFA attempts, please try again later" },
});

export const emailVerificationRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: { message: "Too many verification requests, please try again later" },
});

export const emailVerificationResendRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) =>
    `${req.body?.email || "unknown"}:${ipKeyGenerator(req.ip)}`,
  message: { message: "Too many verification requests, please try again later" },
});

export const emailChangeRateLimit = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: { message: "Too many email change attempts, please try again later" },
});
