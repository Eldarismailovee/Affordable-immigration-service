import { getPricingPreview } from "../services/pricing.service.js";
import { pricingResponseSchema } from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export function calculatePricingController(req, res) {
  const result = getPricingPreview(req.body);
  sendResponse(res, pricingResponseSchema, result);
}
