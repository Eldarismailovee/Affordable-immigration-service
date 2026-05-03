import { sanitizeUser } from "../utils/auth.js";
import {
  countActiveAdmins,
  findUserById,
  listUsers as listUserRows,
  updateUserRoleById,
} from "../repositories/user.repository.js";

export async function getUserById(userId) {
  return findUserById(userId);
}

export async function listUsers() {
  const users = await listUserRows();
  return users.map(sanitizeUser);
}

export async function updateUserRole(userId, role) {
  if (!["admin", "user"].includes(role)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  const currentUser = await findUserById(userId);

  if (!currentUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (currentUser.role === "admin" && role !== "admin") {
    const activeAdminCount = await countActiveAdmins();

    if (activeAdminCount <= 1) {
      const error = new Error("At least one active administrator is required");
      error.statusCode = 400;
      throw error;
    }
  }

  return sanitizeUser(await updateUserRoleById(userId, role));
}
