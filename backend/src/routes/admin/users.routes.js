import { Router } from "express";
import {
  deleteUserController,
  listUsersController,
  updateUserRoleController,
} from "../../controllers/users-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateUserRoleSchema } from "../../schemas/auth.schema.js";

const router = Router();

router.get("/", listUsersController);
router.patch("/:userId/role", validateRequest(updateUserRoleSchema), updateUserRoleController);
router.delete("/:userId", deleteUserController);

export default router;
