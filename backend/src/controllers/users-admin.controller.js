import { deleteUser, listUsers, updateUserRole } from "../services/user.service.js";
import {
  userMutationResponseSchema,
  usersListResponseSchema,
} from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export async function listUsersController(_req, res, next) {
  try {
    const users = await listUsers();
    sendResponse(res, usersListResponseSchema, { users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRoleController(req, res, next) {
  try {
    const user = await updateUserRole(req.params.userId, req.body.role);
    sendResponse(res, userMutationResponseSchema, { user });
  } catch (error) {
    next(error);
  }
}

export async function deleteUserController(req, res, next) {
  try {
    const user = await deleteUser(req.params.userId);
    sendResponse(res, userMutationResponseSchema, { user });
  } catch (error) {
    next(error);
  }
}
