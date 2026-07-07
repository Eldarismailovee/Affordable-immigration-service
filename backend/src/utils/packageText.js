import { GUIDANCE_PACKAGE } from "../constants/domain.js";

export function getPackageLabel(selectedPackage) {
  return selectedPackage === GUIDANCE_PACKAGE
    ? "Attorney Guidance"
    : "Attorney-prepared filing package";
}

export function getAgreementScopeText(selectedPackage) {
  return selectedPackage === GUIDANCE_PACKAGE
    ? "Client files the matter."
    : "Attorney files the matter.";
}

export function getOnboardingScopeText(selectedPackage) {
  return selectedPackage === GUIDANCE_PACKAGE
    ? "Client files the petition package."
    : "Attorney prepares and files the petition package.";
}
