import { calculatePricing } from "../utils/pricingCalculator.js";

export function getPricingPreview(payload) {
  return calculatePricing(payload);
}