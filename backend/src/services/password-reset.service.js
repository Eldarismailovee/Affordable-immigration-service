import { randomUUID } from "crypto";
import env from "../config/env.js";
import {
  PASSWORD_RESET_TOKEN_TTL_MINUTES,
  addMinutes,
  createOpaqueToken,
  hashPassword,
  hashToken,
} from "../utils/auth.js";
import {
  consumePasswordResetToken,
  createPasswordResetToken,
  revokeUserRefreshTokens,
} from "../repositories/auth-token.repository.js";
import {
  findUserByEmail,
  updateUserPasswordById,
} from "../repositories/user.repository.js";
import { sendPasswordResetEmail } from "./email.service.js";
import { AppError } from "../utils/appError.js";

function authMessage(message, debugToken) {
  return {
    message,
    ...(debugToken && !env.isProduction ? { debugToken } : {}),
  };
}

function invalidResetTokenError() {
  return new AppError(
    "Invalid or expired reset token",
    400,
    "BAD_REQUEST"
  );
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
  const delivery = await sendPasswordResetEmail(user.email, resetToken);

  if (delivery.deliveryStatus === "not_configured") {
    return authMessage(
      "If an account exists, password reset could not be delivered because email is not configured",
      resetToken
    );
  }

  return authMessage(
    "If an account exists, password reset instructions will be sent",
    resetToken
  );
}

export async function confirmPasswordReset(payload) {
  const tokenRow = await consumePasswordResetToken(hashToken(payload.token));

  if (!tokenRow) {
    throw invalidResetTokenError();
  }

  const passwordHash = await hashPassword(payload.password);
  await updateUserPasswordById(tokenRow.user_id, passwordHash);
  await revokeUserRefreshTokens(tokenRow.user_id);

  return authMessage("Password updated successfully");
}
