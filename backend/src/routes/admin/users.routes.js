import { Router } from "express";
import {
  listUsersController,
  updateUserRoleController,
} from "../../controllers/users-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateUserRoleSchema } from "../../schemas/auth.schema.js";

const router = Router();

router.get("/", listUsersController);
router.patch("/:userId/role", validateRequest(updateUserRoleSchema), updateUserRoleController);

export default router;
