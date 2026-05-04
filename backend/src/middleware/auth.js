import { getUserFromAccessToken } from "../services/auth.service.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function getBearerToken(req) {
  const header = req.get("authorization") || "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  req.user = await getUserFromAccessToken(token);
  next();
});

export function requireAuth(req, res, next) {
  if (!req.user) {
    next(new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
    return;
  }

  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError("Insufficient permissions", 403, "INSUFFICIENT_PERMISSIONS"));
      return;
    }

    next();
  };
}
