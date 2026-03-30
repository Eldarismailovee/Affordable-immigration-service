import { Router } from "express";
import { calculatePricingController } from "../controllers/pricing.controller.js";

const router = Router();

router.post("/calculate", calculatePricingController);

export default router;