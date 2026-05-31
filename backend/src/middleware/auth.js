import {
  authenticationRequiredError,
  insufficientPermissionsError,
} from "../domain/errors.js";
import { getUserFromAccessToken } from "../services/auth.service.js";
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
    next(authenticationRequiredError());
    return;
  }

  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(authenticationRequiredError());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(insufficientPermissionsError());
      return;
    }

    next();
  };
}
