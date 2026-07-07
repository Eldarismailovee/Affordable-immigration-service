import { ACTIVE_USER_STATUS, USER_ROLE } from "../constants/domain.js";
import {
  hashPassword,
  sanitizeUser,
  verifyAuthToken,
  verifyPassword,
} from "../utils/auth.js";
import { normalizeEmail } from "../utils/email.js";
import { isUniqueViolation } from "../db/errors.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  getSessionSecurityVersion,
} from "../repositories/user.repository.js";
import { createAuthSession } from "./session.service.js";
import { AppError } from "../utils/appError.js";
import {
  AUDIT_AUTH_REASONS,
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { emailDomainOnly } from "../utils/auditRedaction.js";
import { buildActor } from "../utils/auditContext.js";
import { MFA_CHALLENGE_PURPOSE, MFA_ERROR_CODES, isPrivilegedRole } from "../constants/mfa.js";
import {
  createLoginMfaChallenge,
  hasActiveMfa,
} from "./mfa.service.js";
import {
  assertPrivilegedEmailVerified,
  createRegistrationVerification,
} from "./email-verification.service.js";

function duplicateEmailError() {
  return new AppError(
    "A user with this email already exists",
    409,
    "CONFLICT"
  );
}

function invalidCredentialsError() {
  return new AppError(
    "Invalid email or password",
    401,
    "AUTHENTICATION_REQUIRED"
  );
}

export async function registerUser(payload, requestContext) {
  const email = normalizeEmail(payload.email);

  if (!email) {
    throw new AppError("Valid email is required", 400, "BAD_REQUEST");
  }

  const existing = await findUserByEmail(email);

  if (existing) {
    throw duplicateEmailError();
  }

  const role = USER_ROLE;
  const passwordHash = await hashPassword(payload.password);

  let createdUser;

  try {
    createdUser = await createUser({
      email,
      passwordHash,
      fullName: payload.fullName,
      role,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw duplicateEmailError();
    }

    throw error;
  }

  const user = sanitizeUser(createdUser);

  await createRegistrationVerification({
    userId: user.id,
    email: user.email,
    requestContext,
  });

  return createAuthSession(user, requestContext);
}

async function auditLoginFailure({ requestContext, user, reasonCode, email }) {
  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN_FAILURE,
    category: AUDIT_CATEGORIES.AUTH,
    action: "login",
    result: AUDIT_RESULTS.FAILURE,
    targetType: "user",
    targetId: user?.id ?? null,
    request: requestContext,
    reasonCode,
    metadata: {
      emailDomain: emailDomainOnly(email),
    },
  });
}

export async function loginUser(payload, requestContext) {
  const email = normalizeEmail(payload.email);
  const user = await findUserByEmail(email);
  const auditRequest = {
    requestId: requestContext?.requestId,
    userAgent: requestContext?.userAgent,
    ipHash: requestContext?.ipHash,
  };

  if (!user) {
    await auditLoginFailure({
      requestContext: auditRequest,
      user: null,
      email,
      reasonCode: AUDIT_AUTH_REASONS.INVALID_CREDENTIALS,
    });
    throw invalidCredentialsError();
  }

  if (user.status !== ACTIVE_USER_STATUS) {
    await auditLoginFailure({
      requestContext: auditRequest,
      user,
      email,
      reasonCode: AUDIT_AUTH_REASONS.DISABLED_USER,
    });
    throw invalidCredentialsError();
  }

  const passwordOk = await verifyPassword(payload.password, user.password_hash);

  if (!passwordOk) {
    await auditLoginFailure({
      requestContext: auditRequest,
      user,
      email,
      reasonCode: AUDIT_AUTH_REASONS.INVALID_CREDENTIALS,
    });
    throw invalidCredentialsError();
  }

  const safeUser = sanitizeUser(user);

  if (isPrivilegedRole(safeUser.role)) {
    try {
      assertPrivilegedEmailVerified(safeUser);
    } catch (error) {
      await auditLoginFailure({
        requestContext: auditRequest,
        user,
        email,
        reasonCode: AUDIT_AUTH_REASONS.DISABLED_USER,
      });
      throw error;
    }

    const enrolled = await hasActiveMfa(safeUser.id);

    if (!enrolled) {
      const challenge = await createLoginMfaChallenge(
        safeUser,
        MFA_CHALLENGE_PURPOSE.ENROLLMENT,
        auditRequest
      );

      return {
        mfaEnrollmentRequired: true,
        ...challenge,
        code: MFA_ERROR_CODES.MFA_ENROLLMENT_REQUIRED,
      };
    }

    const challenge = await createLoginMfaChallenge(
      safeUser,
      MFA_CHALLENGE_PURPOSE.LOGIN,
      auditRequest
    );

    return {
      mfaRequired: true,
      ...challenge,
      code: MFA_ERROR_CODES.MFA_REQUIRED,
    };
  }

  const session = await createAuthSession(safeUser, requestContext);

  await recordAuditEvent({
    eventType: AUDIT_EVENT_TYPES.AUTH_LOGIN_SUCCESS,
    category: AUDIT_CATEGORIES.AUTH,
    action: "login",
    result: AUDIT_RESULTS.SUCCESS,
    ...buildActor(safeUser),
    targetType: "user",
    targetId: safeUser.id,
    request: auditRequest,
    metadata: { emailDomain: emailDomainOnly(email) },
  });

  return session;
}

export async function getUserFromAccessToken(token) {
  const payload = token ? await verifyAuthToken(token) : null;

  if (!payload?.sub) {
    return null;
  }

  const user = await findUserById(payload.sub);

  if (user?.status !== ACTIVE_USER_STATUS) {
    return null;
  }

  const currentSecVer = await getSessionSecurityVersion(user.id);

  if (Number(payload.secVer) !== Number(currentSecVer)) {
    return null;
  }

  return {
    user: sanitizeUser(user),
    token: payload,
  };
}
