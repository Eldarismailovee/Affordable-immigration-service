import { Router } from "express";
import { calculatePricingController } from "../../controllers/pricing.controller.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { pricingPreviewSchema } from "../../schemas/intake.schema.js";

const router = Router();

router.post("/calculate", validateRequest(pricingPreviewSchema), calculatePricingController);

export default router;
