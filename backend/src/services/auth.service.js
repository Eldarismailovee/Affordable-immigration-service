import { randomUUID } from "crypto";
import env from "../config/env.js";
import { ACTIVE_USER_STATUS, ADMIN_ROLE, USER_ROLE } from "../constants/domain.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
  REFRESH_TOKEN_TTL_DAYS,
  addDays,
  addHours,
  addMinutes,
  createAccessToken,
  createOpaqueToken,
  hashPassword,
  hashToken,
  sanitizeUser,
  verifyPassword,
} from "../utils/auth.js";
import {
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshTokenByHash,
  revokeUserRefreshTokens,
  rotateRefreshToken,
} from "../repositories/auth-token.repository.js";
import {
  countUsers,
  createUser,
  findUserByEmail,
  findUserById,
  markUserEmailVerifiedById,
  updateUserPasswordById,
} from "../repositories/user.repository.js";
import {
  sendEmailVerificationEmail,
  sendPasswordResetEmail,
} from "./email.service.js";

async function getInitialRole() {
  return (await countUsers()) === 0 ? ADMIN_ROLE : USER_ROLE;
}

function getRequestMetadata(requestContext = {}) {
  return {
    userAgent: requestContext.userAgent || "",
    ipAddress: requestContext.ipAddress || "",
  };
}

function authMessage(message, debugToken) {
  return {
    message,
    ...(debugToken && !env.isProduction ? { debugToken } : {}),
  };
}

async function createAuthSession(user, requestContext = {}) {
  const refreshToken = createOpaqueToken();
  const refreshTokenId = randomUUID();
  const metadata = getRequestMetadata(requestContext);

  await createRefreshToken({
    id: refreshTokenId,
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: addDays(new Date(), REFRESH_TOKEN_TTL_DAYS),
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  });

  return {
    user,
    token: await createAccessToken(user, { sessionId: refreshTokenId }),
    refreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function registerUser(payload, requestContext) {
  const email = payload.email.toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    const error = new Error("A user with this email already exists");
    error.statusCode = 409;
    throw error;
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
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordOk = await verifyPassword(payload.password, user.password_hash);

  if (!passwordOk) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const safeUser = sanitizeUser(user);

  return createAuthSession(safeUser, requestContext);
}

export async function refreshAuthSession(refreshToken, requestContext) {
  const tokenHash = hashToken(refreshToken);
  const tokenRow = await findRefreshTokenByHash(tokenHash);

  if (!tokenRow || tokenRow.revoked_at || new Date(tokenRow.expires_at) <= new Date()) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  const user = await findUserById(tokenRow.user_id);

  if (!user || user.status !== ACTIVE_USER_STATUS) {
    const error = new Error("Invalid refresh token");
    error.statusCode = 401;
    throw error;
  }

  const nextRefreshToken = createOpaqueToken();
  const nextRefreshTokenId = randomUUID();
  const metadata = getRequestMetadata(requestContext);

  await rotateRefreshToken({
    currentTokenId: tokenRow.id,
    nextTokenId: nextRefreshTokenId,
    userId: user.id,
    tokenHash: hashToken(nextRefreshToken),
    expiresAt: addDays(new Date(), REFRESH_TOKEN_TTL_DAYS),
    userAgent: metadata.userAgent,
    ipAddress: metadata.ipAddress,
  });

  return {
    token: await createAccessToken(sanitizeUser(user), { sessionId: nextRefreshTokenId }),
    refreshToken: nextRefreshToken,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function logoutUser(refreshToken) {
  await revokeRefreshTokenByHash(hashToken(refreshToken));
  return authMessage("Signed out successfully");
}

export async function requestPasswordReset(payload) {
  const user = await findUserByEmail(payload.email);

  if (!user) {
    return authMessage("If an account exists, password reset instructions will be sent");
  }

  const resetToken = createOpaqueToken();

  await createPasswordResetToken({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashToken(resetToken),
    expiresAt: addMinutes(new Date(), PASSWORD_RESET_TOKEN_TTL_MINUTES),
  });
  sendPasswordResetEmail(user.email, resetToken);

  return authMessage(
    "If an account exists, password reset instructions will be sent",
    resetToken
  );
}

export async function confirmPasswordReset(payload) {
  const tokenRow = await consumePasswordResetToken(hashToken(payload.token));

  if (!tokenRow) {
    const error = new Error("Invalid or expired reset token");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await hashPassword(payload.password);
  await updateUserPasswordById(tokenRow.user_id, passwordHash);
  await revokeUserRefreshTokens(tokenRow.user_id);

  return authMessage("Password updated successfully");
}

export async function requestEmailVerification(user) {
  const verificationToken = createOpaqueToken();

  await createEmailVerificationToken({
    id: randomUUID(),
    userId: user.id,
    tokenHash: hashToken(verificationToken),
    expiresAt: addHours(new Date(), EMAIL_VERIFICATION_TOKEN_TTL_HOURS),
  });
  sendEmailVerificationEmail(user.email, verificationToken);

  return authMessage("Verification email sent", verificationToken);
}

export async function confirmEmailVerification(token) {
  const tokenRow = await consumeEmailVerificationToken(hashToken(token));

  if (!tokenRow) {
    const error = new Error("Invalid or expired verification token");
    error.statusCode = 400;
    throw error;
  }

  await markUserEmailVerifiedById(tokenRow.user_id);

  return authMessage("Email verified successfully");
}
