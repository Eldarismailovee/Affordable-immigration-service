import { getPricingPreview } from "../services/pricing.service.js";

export function calculatePricingController(req, res) {
  const result = getPricingPreview(req.body);
  res.json(result);
}