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

  const user = sanitizeUser(
    await createUser({
      email,
      passwordHash,
      fullName: payload.fullName,
      role,
    })
  );

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

export async function loginUser(payload, requestContext) {
  const user = await findUserByEmail(payload.email);

  if (!user || user.status !== ACTIVE_USER_STATUS) {
    throw invalidCredentialsError();
  }

  const passwordOk = await verifyPassword(payload.password, user.password_hash);

  if (!passwordOk) {
    throw invalidCredentialsError();
  }

  const safeUser = sanitizeUser(user);

  return createAuthSession(safeUser, requestContext);
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
