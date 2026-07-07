import {
  authenticationRequiredError,
  insufficientPermissionsError,
} from "../domain/errors.js";
import { EMAIL_VERIFICATION_ERROR_CODES, isEmailVerified } from "../constants/emailVerification.js";
import { getUserFromAccessToken } from "../services/auth.service.js";
import {
  assertStepUpFresh,
  enrollmentRequiredError,
  isPrivilegedRole,
} from "../services/mfa.service.js";
import { MFA_ERROR_CODES } from "../constants/mfa.js";
import { AppError } from "../utils/appError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function getBearerToken(req) {
  const header = req.get("authorization") || "";

  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function privilegedMfaRequiredError() {
  return new AppError(
    "MFA verification is required",
    403,
    MFA_ERROR_CODES.MFA_REQUIRED
  );
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = getBearerToken(req);
  const auth = await getUserFromAccessToken(token);
  req.user = auth?.user ?? null;
  req.auth = auth?.token ?? null;
  next();
});

export function requireAuth(req, res, next) {
  if (!req.user) {
    next(authenticationRequiredError());
    return;
  }

  next();
}

export function requirePrivilegedMfa(req, res, next) {
  if (!req.user) {
    next(authenticationRequiredError());
    return;
  }

  if (!isPrivilegedRole(req.user.role)) {
    next();
    return;
  }

  if (!isEmailVerified(req.user)) {
    next(
      new AppError(
        "Email verification is required for this operation.",
        403,
        EMAIL_VERIFICATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED
      )
    );
    return;
  }

  if (!req.auth?.mfa) {
    next(privilegedMfaRequiredError());
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

    if (isPrivilegedRole(req.user.role) && !req.auth?.mfa) {
      next(privilegedMfaRequiredError());
      return;
    }

    next();
  };
}

export function requireVerifiedEmail(req, res, next) {
  if (!req.user) {
    next(authenticationRequiredError());
    return;
  }

  if (!isEmailVerified(req.user)) {
    next(
      new AppError(
        "Email verification is required for this operation.",
        403,
        EMAIL_VERIFICATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED
      )
    );
    return;
  }

  next();
}

export function requireStepUp(maxAgeSeconds) {
  return (req, _res, next) => {
    if (!req.user || !req.auth) {
      next(authenticationRequiredError());
      return;
    }

    if (!req.auth.mfa) {
      next(enrollmentRequiredError());
      return;
    }

    try {
      const mfaAt = req.auth.mfaAt
        ? new Date(req.auth.mfaAt * 1000)
        : null;
      assertStepUpFresh(mfaAt, maxAgeSeconds);
      next();
    } catch (error) {
      next(error);
    }
  };
}
