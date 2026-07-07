import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required"),
    email: z.email("Valid email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export const loginSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

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

export const resendEmailVerificationSchema = z.object({
  email: z.email("Valid email is required"),
});

export const changeEmailSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});
