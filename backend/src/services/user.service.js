import { sanitizeUser } from "../utils/auth.js";
import { ADMIN_ROLE } from "../constants/domain.js";
import {
  countActiveAdmins,
  findUserById,
  listUsers as listUserRows,
  softDeleteUserById,
  updateUserRoleById,
} from "../repositories/user.repository.js";
import { userRoleSchema } from "../domain/validators.js";
import { AppError } from "../utils/appError.js";
import { assertAdminAccess } from "./access.service.js";

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

  const result = userRoleSchema.safeParse(role);

  if (!result.success) {
    throw new AppError("Invalid role", 400, "INVALID_ROLE");
  }

  const nextRole = result.data;

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (currentUser.role === ADMIN_ROLE && nextRole !== ADMIN_ROLE) {
    const activeAdminCount = await countActiveAdmins();

    if (activeAdminCount <= 1) {
      throw new AppError(
        "At least one active administrator is required",
        400,
        "LAST_ACTIVE_ADMIN"
      );
    }
  }

  return sanitizeUser(await updateUserRoleById(userId, nextRole));
}

export async function deleteUser({ userId, actor }) {
  assertAdminAccess(actor);

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    throw new AppError("User not found", 404, "USER_NOT_FOUND");
  }

  if (currentUser.role === ADMIN_ROLE) {
    const activeAdminCount = await countActiveAdmins();

    if (activeAdminCount <= 1) {
      throw new AppError(
        "At least one active administrator is required",
        400,
        "LAST_ACTIVE_ADMIN"
      );
    }
  }

  return sanitizeUser(await softDeleteUserById(userId));
}
