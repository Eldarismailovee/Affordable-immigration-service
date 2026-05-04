import { Router } from "express";
import {
  deleteUserController,
  listUsersController,
  updateUserRoleController,
} from "../../controllers/users-admin.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { updateUserRoleSchema } from "../../schemas/admin.schema.js";
import { userIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.get("/", listUsersController);
router.patch(
  "/:userId/role",
  validateRequest({ params: userIdParamsSchema, body: updateUserRoleSchema }),
  updateUserRoleController
);
router.delete("/:userId", validateRequest({ params: userIdParamsSchema }), deleteUserController);

export default router;
