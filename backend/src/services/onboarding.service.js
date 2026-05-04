import { renderOnboardingHtml } from "../templates/onboarding.template.js";
import {
  getOnboardingScopeText,
  getPackageLabel,
} from "../utils/packageText.js";

export function generateOnboardingPacket(payload) {
  const additionalCount = Number(payload.additionalI130Count || 0);
  const packageLabel = getPackageLabel(payload.selectedPackage);
  const whoFiles = getOnboardingScopeText(payload.selectedPackage);
  const expeditedText = payload.expedited
    ? "Expedited firm processing selected (+$500)."
    : "No expedited processing selected.";

  return {
    title: "Client Onboarding Packet",
    html: renderOnboardingHtml({
      payload,
      packageLabel,
      whoFiles,
      additionalCount,
      expeditedText,
    }),
  };
}
