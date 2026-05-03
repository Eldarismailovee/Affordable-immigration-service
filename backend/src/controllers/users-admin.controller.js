import { listUsers, updateUserRole } from "../services/user.service.js";

export async function listUsersController(_req, res, next) {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRoleController(req, res, next) {
  try {
    const user = await updateUserRole(req.params.userId, req.body.role);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}
