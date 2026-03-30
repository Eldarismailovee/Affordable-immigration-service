import { Router } from "express";
import { updatePaymentStatusController } from "../controllers/payment-admin.controller.js";

const router = Router();

router.patch("/:leadId/status", updatePaymentStatusController);

export default router;
