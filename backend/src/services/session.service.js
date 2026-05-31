import { randomUUID } from "crypto";
import { ACTIVE_USER_STATUS } from "../constants/domain.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_DAYS,
  addDays,
  createAccessToken,
  createOpaqueToken,
  hashToken,
  sanitizeUser,
} from "../utils/auth.js";
import {
  createRefreshToken,
  findRefreshTokenByHash,
  RefreshTokenRotationError,
  revokeRefreshTokenByHash,
  revokeUserRefreshTokens,
  rotateRefreshToken,
} from "../repositories/auth-token.repository.js";
import { findUserById } from "../repositories/user.repository.js";
import { AppError } from "../utils/appError.js";
import { logger } from "../lib/logger.js";

function getRequestMetadata(requestContext = {}) {
  return {
    userAgent: requestContext.userAgent || "",
    ipAddress: requestContext.ipAddress || "",
  };
}

function authMessage(message) {
  return { message };
}

function invalidRefreshTokenError() {
  return new AppError(
    "Invalid refresh token",
    401,
    "AUTHENTICATION_REQUIRED"
  );
}

export async function createAuthSession(user, requestContext = {}) {
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

export async function refreshAuthSession(refreshToken, requestContext) {
  const tokenHash = hashToken(refreshToken);
  const tokenRow = await findRefreshTokenByHash(tokenHash);

  if (!tokenRow) {
    throw invalidRefreshTokenError();
  }

  if (tokenRow.revoked_at) {
    await revokeUserRefreshTokens(tokenRow.user_id);
    logger.warn(
      {
        userId: tokenRow.user_id,
        tokenId: tokenRow.id,
        event: "refresh_token_reuse_detected",
      },
      "Revoked refresh token reuse detected; revoked all user refresh tokens"
    );
    throw invalidRefreshTokenError();
  }

  if (new Date(tokenRow.expires_at) <= new Date()) {
    throw invalidRefreshTokenError();
  }

  const user = await findUserById(tokenRow.user_id);

  if (!user || user.status !== ACTIVE_USER_STATUS) {
    throw invalidRefreshTokenError();
  }

  const nextRefreshToken = createOpaqueToken();
  const nextRefreshTokenId = randomUUID();
  const metadata = getRequestMetadata(requestContext);

  try {
    await rotateRefreshToken({
      currentTokenId: tokenRow.id,
      nextTokenId: nextRefreshTokenId,
      userId: user.id,
      tokenHash: hashToken(nextRefreshToken),
      expiresAt: addDays(new Date(), REFRESH_TOKEN_TTL_DAYS),
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
    });
  } catch (error) {
    if (error instanceof RefreshTokenRotationError) {
      throw invalidRefreshTokenError();
    }

    throw error;
  }

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
