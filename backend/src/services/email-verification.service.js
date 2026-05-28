import { randomUUID } from "crypto";
import env from "../config/env.js";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
  addHours,
  createOpaqueToken,
  hashToken,
} from "../utils/auth.js";
import {
  consumeEmailVerificationToken,
  createEmailVerificationToken,
} from "../repositories/auth-token.repository.js";
import { markUserEmailVerifiedById } from "../repositories/user.repository.js";
import { sendEmailVerificationEmail } from "./email.service.js";
import { AppError } from "../utils/appError.js";

function authMessage(message, debugToken) {
  return {
    message,
    ...(debugToken && !env.isProduction ? { debugToken } : {}),
  };
}

function invalidVerificationTokenError() {
  return new AppError(
    "Invalid or expired verification token",
    400,
    "BAD_REQUEST"
  );
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
    throw invalidVerificationTokenError();
  }

  await markUserEmailVerifiedById(tokenRow.user_id);

  return authMessage("Email verified successfully");
}
