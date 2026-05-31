import env from "../config/env.js";
import { ADMIN_ROLE } from "../constants/domain.js";
import { isUniqueViolation } from "../db/errors.js";
import { createUser, findUserByEmail } from "../repositories/user.repository.js";
import { hashPassword } from "../utils/auth.js";

export async function seedInitialAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    return;
  }

  const email = env.ADMIN_EMAIL.toLowerCase();
  const existingAdmin = await findUserByEmail(email);

  if (existingAdmin) {
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  try {
    await createUser({
      email,
      passwordHash,
      fullName: env.ADMIN_NAME || "System Administrator",
      role: ADMIN_ROLE,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return;
    }

    throw error;
  }
}
