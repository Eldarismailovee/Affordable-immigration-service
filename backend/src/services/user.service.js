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

export async function updateUserRole({ userId, role, actor }) {
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

  return sanitizeUser(await updateUserRoleById(userId, nextRole));
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
