import { randomUUID } from "crypto";
import emailVerificationConfig from "../config/emailVerification.js";
import env from "../config/env.js";
import {
  EMAIL_VERIFICATION_DELIVERY_STATUS,
  EMAIL_VERIFICATION_PURPOSE,
} from "../constants/emailVerification.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import {
  createEmailVerificationToken,
  invalidateEmailVerificationTokensForUser,
} from "../repositories/auth-token.repository.js";
import {
  addSeconds,
  createOpaqueToken,
  hashToken,
} from "../utils/auth.js";
import { normalizeEmail } from "../utils/email.js";
import { sendEmailVerificationEmail } from "./email.service.js";
import { recordAuditEvent } from "./audit.service.js";
import { emailDomainOnly } from "../utils/auditRedaction.js";

let lastTestVerificationToken = null;

export function __testGetLastVerificationToken() {
  return lastTestVerificationToken;
}

export function __testClearLastVerificationToken() {
  lastTestVerificationToken = null;
}

function setLastTestVerificationToken(token) {
  lastTestVerificationToken = token;
}

function buildVerificationUrl() {
  return `${emailVerificationConfig.publicUrl.replace(/\/$/, "")}/verify-email`;
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

export async function issueVerificationTokenForChange({
  userId,
  email,
  purpose = EMAIL_VERIFICATION_PURPOSE.EMAIL_CHANGE,
  requestContext = null,
}) {
  await invalidateEmailVerificationTokensForUser(userId);

  const verificationToken = createOpaqueToken();
  const expiresAt = addSeconds(new Date(), emailVerificationConfig.tokenTtlSeconds);

  await createEmailVerificationToken({
    id: randomUUID(),
    userId,
    email: normalizeEmail(email),
    tokenHash: hashToken(verificationToken),
    purpose,
    expiresAt,
  });

  if (process.env.NODE_ENV === "test") {
    setLastTestVerificationToken(verificationToken);
  }

  await auditVerificationEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_TOKEN_CREATED,
    result: AUDIT_RESULTS.SUCCESS,
    userId,
    requestContext,
    metadata: {
      purpose,
      emailDomain: emailDomainOnly(email),
    },
  });

  return { verificationToken, expiresAt };
}

export async function deliverVerificationEmail({
  userId,
  email,
  verificationToken,
  purpose,
  requestContext = null,
}) {
  await auditVerificationEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_DELIVERY_REQUESTED,
    result: AUDIT_RESULTS.SUCCESS,
    userId,
    requestContext,
    metadata: { purpose, emailDomain: emailDomainOnly(email) },
  });

  const delivery = await sendEmailVerificationEmail({
    email,
    verificationToken,
    verificationUrl: buildVerificationUrl(),
  });

  if (delivery.deliveryStatus === EMAIL_VERIFICATION_DELIVERY_STATUS.NOT_CONFIGURED) {
    await auditVerificationEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_DELIVERY_FAILED,
      result: AUDIT_RESULTS.FAILURE,
      userId,
      requestContext,
      metadata: {
        purpose,
        deliveryStatus: delivery.deliveryStatus,
        emailDomain: emailDomainOnly(email),
      },
    });

    return {
      deliveryStatus: EMAIL_VERIFICATION_DELIVERY_STATUS.NOT_CONFIGURED,
      message:
        "Verification email could not be delivered because email is not configured",
      debugToken: env.isProduction ? undefined : verificationToken,
    };
  }

  if (delivery.deliveryStatus === EMAIL_VERIFICATION_DELIVERY_STATUS.FAILED) {
    await auditVerificationEvent({
      eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_DELIVERY_FAILED,
      result: AUDIT_RESULTS.FAILURE,
      userId,
      requestContext,
      metadata: {
        purpose,
        deliveryStatus: delivery.deliveryStatus,
        emailDomain: emailDomainOnly(email),
      },
    });

    return {
      deliveryStatus: EMAIL_VERIFICATION_DELIVERY_STATUS.FAILED,
      message: "Verification email could not be delivered",
      debugToken: env.isProduction ? undefined : verificationToken,
    };
  }

  await auditVerificationEvent({
    eventType: AUDIT_EVENT_TYPES.EMAIL_VERIFICATION_PROVIDER_ACCEPTED,
    result: AUDIT_RESULTS.SUCCESS,
    userId,
    requestContext,
    metadata: {
      purpose,
      deliveryStatus: delivery.deliveryStatus,
      emailDomain: emailDomainOnly(email),
    },
  });

  return {
    deliveryStatus: delivery.deliveryStatus,
    message: "Verification email sent",
    debugToken: env.isProduction ? undefined : verificationToken,
  };
}
