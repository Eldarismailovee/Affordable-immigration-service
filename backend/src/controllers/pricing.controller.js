import { getPricingPreview } from "../services/pricing.service.js";
import { pricingResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const calculatePricingController = asyncHandler((req, res) => {
  const result = getPricingPreview(req.body);
  sendResponse(res, pricingResponseSchema, result);
});
