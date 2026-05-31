import { randomUUID } from "crypto";
import { ACTIVE_USER_STATUS, ADMIN_ROLE, USER_ROLE } from "../constants/domain.js";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
  addHours,
  createOpaqueToken,
  hashPassword,
  hashToken,
  sanitizeUser,
  verifyAuthToken,
  verifyPassword,
} from "../utils/auth.js";
import { isUniqueViolation } from "../db/errors.js";
import { createEmailVerificationToken } from "../repositories/auth-token.repository.js";
import {
  countUsers,
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/user.repository.js";
import { sendEmailVerificationEmail } from "./email.service.js";
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

async function getInitialRole() {
  return (await countUsers()) === 0 ? ADMIN_ROLE : USER_ROLE;
}

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
  const email = payload.email.toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    throw duplicateEmailError();
  }

  const role = await getInitialRole();
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

  const verificationToken = createOpaqueToken();

  await createEmailVerificationToken({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashToken(verificationToken),
    expiresAt: addHours(new Date(), EMAIL_VERIFICATION_TOKEN_TTL_HOURS),
  });
  sendEmailVerificationEmail(user.email, verificationToken);

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
  const email = payload.email.toLowerCase();
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

  return sanitizeUser(user);
}
