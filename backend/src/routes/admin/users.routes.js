import { Router } from "express";
import {
  deleteUserController,
  listUsersController,
  updateUserRoleController,
} from "../../controllers/users-admin.controller.js";
import { requireStepUp } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { requireIdempotencyKey } from "../../middleware/idempotency.js";
import { IDEMPOTENCY_OPERATIONS } from "../../constants/idempotency.js";
import { updateUserRoleSchema } from "../../schemas/admin.schema.js";
import { userIdParamsSchema } from "../../schemas/domain.schema.js";

const router = Router();

router.get("/", listUsersController);
router.patch(
  "/:userId/role",
  requireStepUp(300),
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.ADMIN_USER_ROLE_CHANGE),
  validateRequest({ params: userIdParamsSchema, body: updateUserRoleSchema }),
  updateUserRoleController
);
router.delete(
  "/:userId",
  requireStepUp(300),
  requireIdempotencyKey(IDEMPOTENCY_OPERATIONS.ADMIN_USER_DELETE),
  validateRequest({ params: userIdParamsSchema }),
  deleteUserController
);

export default router;
