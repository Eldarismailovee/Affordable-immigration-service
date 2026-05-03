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

export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "user"]),
});
