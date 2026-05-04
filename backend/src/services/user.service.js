import { sanitizeUser } from "../utils/auth.js";
import { ADMIN_ROLE } from "../constants/domain.js";
import {
  countActiveAdmins,
  findUserById,
  listUsers as listUserRows,
  softDeleteUserById,
  updateUserRoleById,
} from "../repositories/user.repository.js";
import { userRoleSchema } from "../schemas/domain.schema.js";

export async function getUserById(userId) {
  return findUserById(userId);
}

export async function listUsers() {
  const users = await listUserRows();
  return users.map(sanitizeUser);
}

export async function updateUserRole(userId, role) {
  const result = userRoleSchema.safeParse(role);

  if (!result.success) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  const nextRole = result.data;

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (currentUser.role === ADMIN_ROLE && nextRole !== ADMIN_ROLE) {
    const activeAdminCount = await countActiveAdmins();

    if (activeAdminCount <= 1) {
      const error = new Error("At least one active administrator is required");
      error.statusCode = 400;
      throw error;
    }
  }

  return sanitizeUser(await updateUserRoleById(userId, nextRole));
}

export async function deleteUser(userId) {
  const currentUser = await findUserById(userId);

  if (!currentUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (currentUser.role === ADMIN_ROLE) {
    const activeAdminCount = await countActiveAdmins();

    if (activeAdminCount <= 1) {
      const error = new Error("At least one active administrator is required");
      error.statusCode = 400;
      throw error;
    }
  }

  return sanitizeUser(await softDeleteUserById(userId));
}
