import { FILING_PACKAGE, GUIDANCE_PACKAGE } from "../constants/domain.js";

export function calculatePricing({
  selectedPackage,
  additionalI130Count = 0,
  expedited = false,
}) {
  let min = 0;
  let max = 0;

  if (selectedPackage === GUIDANCE_PACKAGE) {
    min = 1000;
    max = 1500;
  }

  if (selectedPackage === FILING_PACKAGE) {
    min = 2000;
    max = 2500;
  }

  const additional = Number(additionalI130Count || 0) * 500;
  const expedite = expedited ? 500 : 0;

  return {
    selectedPackage,
    additionalI130Count: Number(additionalI130Count || 0),
    expedited: Boolean(expedited),
    minTotal: min + additional + expedite,
    maxTotal: max + additional + expedite,
    filingFeesIncluded: false,
  };
}
