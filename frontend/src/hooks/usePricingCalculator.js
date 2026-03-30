import { useMemo } from "react";

export default function usePricingCalculator({
  selectedPackage,
  additionalI130Count,
  expedited,
}) {
  return useMemo(() => {
    let min = 0;
    let max = 0;

    if (selectedPackage === "guidance") {
      min = 1000;
      max = 1500;
    }

    if (selectedPackage === "filing") {
      min = 2000;
      max = 2500;
    }

    const additional = Number(additionalI130Count || 0) * 500;
    const expedite = expedited ? 500 : 0;

    return {
      minTotal: min + additional + expedite,
      maxTotal: max + additional + expedite,
    };
  }, [selectedPackage, additionalI130Count, expedited]);
}