import { z } from "zod";
import { userResponseSchema } from "./user.response.schema.js";

export const authResponseSchema = z.object({
  user: userResponseSchema,
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const tokenRefreshResponseSchema = z.object({
  token: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().int().positive(),
});

export const messageResponseSchema = z
  .object({
    message: z.string(),
    debugToken: z.string().optional(),
  })
  .passthrough();

export const meResponseSchema = z.object({
  user: userResponseSchema.nullable(),
});
