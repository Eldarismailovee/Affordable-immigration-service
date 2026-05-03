import { Router } from "express";
import {
  getLeadDetailController,
  listLeadsController,
} from "../controllers/admin.controller.js";
import {
  listUsersController,
  updateUserRoleController,
} from "../controllers/users-admin.controller.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { updateUserRoleSchema } from "../schemas/auth.schema.js";

const router = Router();

router.get("/leads", listLeadsController);
router.get("/leads/:leadId", getLeadDetailController);
router.get("/users", listUsersController);
router.patch("/users/:userId/role", validateRequest(updateUserRoleSchema), updateUserRoleController);

export default router;
