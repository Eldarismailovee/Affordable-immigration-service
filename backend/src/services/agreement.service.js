import { renderAgreementHtml } from "../templates/agreement.template.js";
import {
  getAgreementScopeText,
  getPackageLabel,
} from "../utils/packageText.js";

export function generateAgreement(payload) {
  const additionalFee = Number(payload.additionalI130Count || 0) * 500;
  const expeditedFee = payload.expedited ? 500 : 0;
  const packageLabel = getPackageLabel(payload.selectedPackage);
  const whoFiles = getAgreementScopeText(payload.selectedPackage);

  return {
    agreementTitle: "Flat-Fee Immigration Engagement Preview",
    html: renderAgreementHtml({
      payload,
      packageLabel,
      whoFiles,
      additionalFee,
      expeditedFee,
    }),
  };
}
