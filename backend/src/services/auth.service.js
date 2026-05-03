import { createAuthToken, hashPassword, sanitizeUser, verifyPassword } from "../utils/auth.js";
import {
  countUsers,
  createUser,
  findUserByEmail,
} from "../repositories/user.repository.js";

async function getInitialRole() {
  return (await countUsers()) === 0 ? "admin" : "user";
}

export async function registerUser(payload) {
  const email = payload.email.toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing) {
    const error = new Error("A user with this email already exists");
    error.statusCode = 409;
    throw error;
  }

  const role = await getInitialRole();
  const passwordHash = await hashPassword(payload.password);

  const user = sanitizeUser(
    await createUser({
      email,
      passwordHash,
      fullName: payload.fullName,
      role,
    })
  );

  return {
    user,
    token: createAuthToken(user),
  };
}

export async function loginUser(payload) {
  const user = await findUserByEmail(payload.email);

  if (!user || user.status !== "active") {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordOk = await verifyPassword(payload.password, user.password_hash);

  if (!passwordOk) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const safeUser = sanitizeUser(user);

  return {
    user: safeUser,
    token: createAuthToken(safeUser),
  };
}
