import { deleteUser, listUsers, updateUserRole } from "../services/user.service.js";
import {
  userMutationResponseSchema,
  usersListResponseSchema,
} from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getAuditContext } from "../utils/auditContext.js";
import { sendResponse } from "../utils/sendResponse.js";
import {
  applyIdempotentReplayHeader,
  executeIdempotentHttpCommand,
} from "../utils/idempotentCommand.js";
import { assertAdminAccess } from "../services/access.service.js";

export const listUsersController = asyncHandler(async (req, res) => {
  const users = await listUsers({ actor: req.user });
  sendResponse(res, usersListResponseSchema, { users });
});

export const updateUserRoleController = asyncHandler(async (req, res) => {
  const auditContext = getAuditContext(req);

  const result = await executeIdempotentHttpCommand({
    req,
    auditContext,
    actor: req.user,
    authorizeReplay: async () => {
      assertAdminAccess(req.user);
    },
    handler: async (client) => {
      const user = await updateUserRole({
        userId: req.params.userId,
        role: req.body.role,
        actor: req.user,
        auditContext,
        client,
      });

      return {
        httpStatus: 200,
        responseBody: { user },
        resourceType: "user",
        resourceId: user.id,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, userMutationResponseSchema, result.responseBody, result.httpStatus);
});

export const deleteUserController = asyncHandler(async (req, res) => {
  const result = await executeIdempotentHttpCommand({
    req,
    actor: req.user,
    authorizeReplay: async () => {
      assertAdminAccess(req.user);
    },
    handler: async (client) => {
      const user = await deleteUser({
        userId: req.params.userId,
        actor: req.user,
        client,
      });

      return {
        httpStatus: 200,
        responseBody: { user },
        resourceType: "user",
        resourceId: user.id,
      };
    },
  });

  applyIdempotentReplayHeader(res, result.replayed);
  sendResponse(res, userMutationResponseSchema, result.responseBody, result.httpStatus);
});
