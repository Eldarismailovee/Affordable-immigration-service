import { legalMeta } from "../data/legalMeta.js";

/** Internal: set confirmedBeforeProduction true only after verified attorney details are entered. */
export const responsibleAttorneyProfile = {
  name: null,
  jurisdiction: null,
  barNumber: null,
  contactEmail: null,
  contactPhone: null,
  officeAddress: null,
  licenseStatus: null,
  confirmedBeforeProduction: false,
  updatedAt: "2026-05-31",
};

export const RESPONSIBLE_ATTORNEY_PUBLIC_TEXT = legalMeta.responsibleAttorney.publicText;

export function getPublicResponsibleAttorneyProfile() {
  const profile = responsibleAttorneyProfile;
  const configured = profile.confirmedBeforeProduction;

  return {
    configured,
    displayMode: configured ? "verified_details" : legalMeta.responsibleAttorney.displayMode,
    publicText: legalMeta.responsibleAttorney.publicText,
    name: configured ? profile.name : null,
    jurisdiction: configured ? profile.jurisdiction : null,
    barNumber: configured ? profile.barNumber : null,
    contactEmail: configured ? profile.contactEmail : null,
    contactPhone: configured ? profile.contactPhone : null,
    officeAddress: configured ? profile.officeAddress : null,
    licenseStatus: configured ? profile.licenseStatus : null,
    pendingVerification: !configured,
    updatedAt: profile.updatedAt,
  };
}
