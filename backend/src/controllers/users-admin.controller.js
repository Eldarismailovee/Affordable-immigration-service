import { deleteUser, listUsers, updateUserRole } from "../services/user.service.js";
import {
  userMutationResponseSchema,
  usersListResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const listUsersController = asyncHandler(async (req, res) => {
  const users = await listUsers({ actor: req.user });
  sendResponse(res, usersListResponseSchema, { users });
});

export const updateUserRoleController = asyncHandler(async (req, res) => {
  const user = await updateUserRole({
    userId: req.params.userId,
    role: req.body.role,
    actor: req.user,
  });
  sendResponse(res, userMutationResponseSchema, { user });
});

export const deleteUserController = asyncHandler(async (req, res) => {
  const user = await deleteUser({ userId: req.params.userId, actor: req.user });
  sendResponse(res, userMutationResponseSchema, { user });
});
