import emailVerificationConfig from "../config/emailVerification.js";
import env from "../config/env.js";
import {
  EMAIL_VERIFICATION_ERROR_CODES,
  EMAIL_VERIFICATION_PURPOSE,
  NEUTRAL_RESEND_MESSAGE,
  isEmailVerified,
} from "../constants/emailVerification.js";
import { isPrivilegedRole } from "../constants/mfa.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import {
  countRecentEmailVerificationSends,
  consumeEmailVerificationToken,
  invalidateEmailVerificationTokensForUser,
  revokeUserRefreshTokens,
} from "../repositories/auth-token.repository.js";
import {
  findUserByEmail,
  findUserById,
  markUserEmailVerifiedById,
  promotePendingEmailById,
} from "../repositories/user.repository.js";
import {
  addSeconds,
  hashToken,
  sanitizeUser,
} from "../utils/auth.js";
import { normalizeEmail } from "../utils/email.js";
import { createAuthSession } from "./session.service.js";
import { AppError } from "../utils/appError.js";
import { emailDomainOnly } from "../utils/auditRedaction.js";
import { withTransaction } from "../db/transaction.js";
import pool from "../db/pool.js";
import { recordAuditEvent } from "./audit.service.js";
import {
  deliverVerificationEmail,
  issueVerificationTokenForChange,
} from "./email-verification-delivery.js";

function verificationRequiredError() {
  return new AppError(
    "Email verification is required for this operation.",
    403,
    EMAIL_VERIFICATION_ERROR_CODES.EMAIL_VERIFICATION_REQUIRED
  );
}

function invalidVerificationTokenError() {
  return new AppError(
    "Invalid or expired verification token",
    400,
    EMAIL_VERIFICATION_ERROR_CODES.INVALID_VERIFICATION_TOKEN
  );
}

function alreadyVerifiedError() {
  return new AppError(
    "Email is already verified",
    409,
    EMAIL_VERIFICATION_ERROR_CODES.EMAIL_ALREADY_VERIFIED
  );
}

function rateLimitedError() {
  return new AppError(
    "Too many verification requests. Please try again later.",
    429,
    EMAIL_VERIFICATION_ERROR_CODES.VERIFICATION_RATE_LIMITED
  );
}

function authMessage(message, extras = {}) {
  const { debugToken, ...rest } = extras;
  return {
    message,
    ...rest,
    ...(debugToken && !env.isProduction ? { debugToken } : {}),
  };
}

async function auditVerificationEvent({
  eventType,
  result,
  userId = null,
  requestContext = null,
  metadata = {},
}) {
  await recordAuditEvent({
    eventType,
    category: AUDIT_CATEGORIES.AUTH,
    action: eventType.split(".").slice(-1)[0],
    result,
    actorUserId: userId,
    targetType: "user",
    targetId: userId,
    request: requestContext,
    metadata,
  });
}

export async function createRegistrationVerification({
  userId,
  email,
  requestContext = null,
}) {
  const { verificationToken } = await issueVerificationTokenForChange({
    userId,
    email,
    purpose: EMAIL_VERIFICATION_PURPOSE.REGISTRATION,
    requestContext,
  });

  return deliverVerificationEmail({
    userId,
    email,
    verificationToken,
    purpose: EMAIL_VERIFICATION_PURPOSE.REGISTRATION,
    requestContext,
  });
}

export async function requestEmailVerification(user, requestContext = null) {
  if (isEmailVerified(user)) {
    throw alreadyVerifiedError();
  }

  const targetEmail = user.pending_email ?? user.email;
  const since = addSeconds(new Date(), -3600);
  const recentSends = await countRecentEmailVerificationSends(user.id, since);

  if (recentSends >= emailVerificationConfig.maxSendsPerHour) {
    await auditVerificationEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_RATE_LIMITED,
      result: AUDIT_RESULTS.FAILURE,
      userId: user.id,
      requestContext,
      metadata: { reason: "hourly_limit" },
    });
    throw rateLimitedError();
  }

  const { verificationToken } = await issueVerificationTokenForChange({
    userId: user.id,
    email: targetEmail,
    purpose: EMAIL_VERIFICATION_PURPOSE.RESEND,
    requestContext,
  });

  const delivery = await deliverVerificationEmail({
    userId: user.id,
    email: targetEmail,
    verificationToken,
    purpose: EMAIL_VERIFICATION_PURPOSE.RESEND,
    requestContext,
  });

  await auditVerificationEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_RESENT,
    result:
      delivery.deliveryStatus === "not_configured" ||
      delivery.deliveryStatus === "failed"
        ? AUDIT_RESULTS.FAILURE
        : AUDIT_RESULTS.SUCCESS,
    userId: user.id,
    requestContext,
    metadata: {
      deliveryStatus: delivery.deliveryStatus,
      emailDomain: emailDomainOnly(targetEmail),
    },
  });

  return authMessage(delivery.message, {
    deliveryStatus: delivery.deliveryStatus,
    debugToken: delivery.debugToken,
  });
}

export async function resendEmailVerificationPublic(payload, requestContext = null) {
  const email = normalizeEmail(payload.email);

  if (!email) {
    return authMessage(NEUTRAL_RESEND_MESSAGE, { deliveryStatus: "unknown" });
  }

  const user = await findUserByEmail(email);

  if (!user || isEmailVerified(user)) {
    return authMessage(NEUTRAL_RESEND_MESSAGE, { deliveryStatus: "unknown" });
  }

  try {
    await requestEmailVerification(user, requestContext);
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === EMAIL_VERIFICATION_ERROR_CODES.VERIFICATION_RATE_LIMITED
    ) {
      throw error;
    }
  }

  return authMessage(NEUTRAL_RESEND_MESSAGE, { deliveryStatus: "unknown" });
}

export async function confirmEmailVerification(token, requestContext = null) {
  const tokenHash = hashToken(token);
  let tokenRow = null;

  await withTransaction(async (client) => {
    tokenRow = await consumeEmailVerificationToken(tokenHash, {}, client);

    if (!tokenRow) {
      await auditVerificationEvent({
        eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_REPLAY_ATTEMPTED,
        result: AUDIT_RESULTS.FAILURE,
        requestContext,
        metadata: {},
      });
      return;
    }

    const user = await findUserById(tokenRow.user_id, client);

    if (!user || user.status !== "active") {
      tokenRow = null;
      return;
    }

    if (tokenRow.purpose === EMAIL_VERIFICATION_PURPOSE.EMAIL_CHANGE) {
      const updated = await promotePendingEmailById(user.id, client);

      if (!updated || normalizeEmail(updated.email) !== normalizeEmail(tokenRow.email)) {
        tokenRow = null;
        return;
      }

      await invalidateEmailVerificationTokensForUser(user.id, {}, client);
      await revokeUserRefreshTokens(user.id, client);

      await auditVerificationEvent({
        eventType: AUDIT_EVENT_TYPES.EMAIL_CHANGE_COMPLETED,
        result: AUDIT_RESULTS.SUCCESS,
        userId: user.id,
        requestContext,
        metadata: { emailDomain: emailDomainOnly(updated.email) },
      });
    } else {
      await markUserEmailVerifiedById(user.id, client);
      await invalidateEmailVerificationTokensForUser(user.id, {}, client);
      await revokeUserRefreshTokens(user.id, client);
    }

    await auditVerificationEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFIED,
      result: AUDIT_RESULTS.SUCCESS,
      userId: user.id,
      requestContext,
      metadata: {
        purpose: tokenRow.purpose,
        emailDomain: emailDomainOnly(tokenRow.email),
      },
    });
  }, pool);

  if (!tokenRow) {
    throw invalidVerificationTokenError();
  }

  const verifiedUser = await findUserById(tokenRow.user_id);
  const session = await createAuthSession(sanitizeUser(verifiedUser), requestContext);

  return {
    ...authMessage("Email verified successfully"),
    ...session,
  };
}

export function assertEmailVerified(user) {
  if (!isEmailVerified(user)) {
    throw verificationRequiredError();
  }
}

export function assertPrivilegedEmailVerified(user) {
  if (isPrivilegedRole(user.role) && !isEmailVerified(user)) {
    throw verificationRequiredError();
  }
}

export { verificationRequiredError, isEmailVerified, NEUTRAL_RESEND_MESSAGE };
