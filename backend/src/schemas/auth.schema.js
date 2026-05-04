import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(32, "Refresh token is required"),
});

export const logoutSchema = refreshTokenSchema;

export const requestPasswordResetSchema = z.object({
  email: z.email("Valid email is required"),
});

export const confirmPasswordResetSchema = z.object({
  token: z.string().min(32, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const confirmEmailVerificationSchema = z.object({
  token: z.string().min(32, "Verification token is required"),
});
