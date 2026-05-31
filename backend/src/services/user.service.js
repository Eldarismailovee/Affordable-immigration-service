import { sanitizeUser } from "../utils/auth.js";
import {
  countActiveAdmins,
  findUserById,
  listUsers as listUserRows,
  softDeleteUserById,
  updateUserRoleById,
} from "../repositories/user.repository.js";
import { assertAdminAccess } from "./access.service.js";
import { userNotFoundError } from "../domain/errors.js";
import {
  AUDIT_CATEGORIES,
  AUDIT_EVENT_TYPES,
  AUDIT_RESULTS,
} from "../constants/audit.js";
import { recordAuditEvent } from "./audit.service.js";
import { buildActor } from "../utils/auditContext.js";
import { withUnitOfWork } from "../repositories/unit-of-work.repository.js";
import {
  assertCanDeleteUser,
  assertCanRemoveAdminRole,
  isAdmin,
  isRemovingAdminRole,
  parseUserRole,
} from "../domain/user.policy.js";

export async function getUserById(userId) {
  return findUserById(userId);
}

export async function listUsers({ actor }) {
  assertAdminAccess(actor);

  const users = await listUserRows();
  return users.map(sanitizeUser);
}

export async function updateUserRole({ userId, role, actor, auditContext = null }) {
  assertAdminAccess(actor);

  const nextRole = parseUserRole(role);

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw userNotFoundError();
  }

  if (isRemovingAdminRole(currentUser, nextRole)) {
    const activeAdminCount = await countActiveAdmins();
    assertCanRemoveAdminRole({ user: currentUser, nextRole, activeAdminCount });
  }

  const oldRole = currentUser.role;

  const updatedUser = await withUnitOfWork(async (client) => {
    const updated = await updateUserRoleById(userId, nextRole, client);

    await recordAuditEvent(
      {
        eventType: AUDIT_EVENT_TYPES.USER_ROLE_CHANGE,
        category: AUDIT_CATEGORIES.USER_ADMIN,
        action: "update_role",
        result: AUDIT_RESULTS.SUCCESS,
        ...buildActor(actor),
        targetType: "user",
        targetId: userId,
        request: auditContext,
        metadata: {
          oldRole,
          newRole: nextRole,
        },
      },
      client
    );

    return updated;
  });

  return sanitizeUser(updatedUser);
}

export async function deleteUser({ userId, actor }) {
  assertAdminAccess(actor);

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw userNotFoundError();
  }

  if (isAdmin(currentUser)) {
    const activeAdminCount = await countActiveAdmins();
    assertCanDeleteUser({ user: currentUser, activeAdminCount });
  }

  return sanitizeUser(await softDeleteUserById(userId));
}
