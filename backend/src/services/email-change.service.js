import { randomUUID } from "crypto";
import {
  EMAIL_VERIFICATION_ERROR_CODES,
  EMAIL_VERIFICATION_PURPOSE,
} from "../constants/emailVerification.js";
import { isPrivilegedRole } from "../constants/mfa.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import {
  invalidateEmailVerificationTokensForUser,
  revokeUserRefreshTokens,
} from "../repositories/auth-token.repository.js";
import {
  findUserByEmail,
  setPendingEmailById,
} from "../repositories/user.repository.js";
import { verifyPassword } from "../utils/auth.js";
import { normalizeEmail } from "../utils/email.js";
import { AppError } from "../utils/appError.js";
import { emailDomainOnly } from "../utils/auditRedaction.js";
import { recordAuditEvent } from "./audit.service.js";
import {
  issueVerificationTokenForChange,
  deliverVerificationEmail,
} from "./email-verification-delivery.js";
import { hasActiveMfa } from "./mfa.service.js";

function duplicateEmailError() {
  return new AppError(
    "Email address is already in use",
    409,
    EMAIL_VERIFICATION_ERROR_CODES.EMAIL_IN_USE
  );
}

function invalidPasswordError() {
  return new AppError("Invalid password", 401, "AUTHENTICATION_REQUIRED");
}

function mfaRequiredError() {
  return new AppError(
    "MFA verification is required for this operation",
    403,
    "MFA_REQUIRED"
  );
}

export async function requestEmailChange({
  user,
  newEmail,
  password,
  mfaCompleted = false,
  requestContext = null,
}) {
  const normalizedEmail = normalizeEmail(newEmail);

  if (!normalizedEmail) {
    throw new AppError("Valid email is required", 400, "BAD_REQUEST");
  }

  if (normalizeEmail(user.email) === normalizedEmail) {
    throw new AppError("New email must differ from current email", 400, "BAD_REQUEST");
  }

  const fullUser = await findUserByEmail(user.email);

  if (!fullUser) {
    throw invalidPasswordError();
  }

  const passwordOk = await verifyPassword(password, fullUser.password_hash);

  if (!passwordOk) {
    throw invalidPasswordError();
  }

  if (isPrivilegedRole(user.role)) {
    const enrolled = await hasActiveMfa(user.id);

    if (!enrolled) {
      throw mfaRequiredError();
    }

    if (!mfaCompleted) {
      throw mfaRequiredError();
    }
  }

  const existing = await findUserByEmail(normalizedEmail);

  if (existing && existing.id !== user.id) {
    throw duplicateEmailError();
  }

  await setPendingEmailById(user.id, normalizedEmail);
  await invalidateEmailVerificationTokensForUser(user.id);
  await revokeUserRefreshTokens(user.id);

  const { verificationToken } = await issueVerificationTokenForChange({
    userId: user.id,
    email: normalizedEmail,
    requestContext,
  });

  const delivery = await deliverVerificationEmail({
    userId: user.id,
    email: normalizedEmail,
    verificationToken,
    purpose: EMAIL_VERIFICATION_PURPOSE.EMAIL_CHANGE,
    requestContext,
  });

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_CHANGE_REQUESTED,
    category: AUDIT_CATEGORIES.AUTH,
    action: "email_change_requested",
    result: AUDIT_RESULTS.SUCCESS,
    actorUserId: user.id,
    actorRole: user.role,
    targetType: "user",
    targetId: user.id,
    request: requestContext,
    metadata: {
      emailDomain: emailDomainOnly(normalizedEmail),
      deliveryStatus: delivery.deliveryStatus,
    },
  });

  return {
    message: "Email change pending verification",
    deliveryStatus: delivery.deliveryStatus,
    pendingEmail: normalizedEmail,
    debugToken: delivery.debugToken,
  };
}
