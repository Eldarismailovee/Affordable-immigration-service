import { z } from "zod";
import { userRoleSchema, userStatusSchema, uuidSchema } from "../../domain/validators.js";
import { dateLikeSchema } from "./shared.schema.js";

export const userResponseSchema = z
  .object({
    id: uuidSchema,
    email: z.email(),
    fullName: z.string(),
    role: userRoleSchema,
    status: userStatusSchema,
    emailVerifiedAt: dateLikeSchema.nullable().optional(),
    processingRestrictedAt: dateLikeSchema.nullable().optional(),
    processingRestrictionReason: z.string().nullable().optional(),
    createdAt: dateLikeSchema.optional(),
    updatedAt: dateLikeSchema.optional(),
  })
  .passthrough();

export const usersListResponseSchema = z.object({
  users: z.array(userResponseSchema),
});

export const userMutationResponseSchema = z.object({
  user: userResponseSchema,
});
