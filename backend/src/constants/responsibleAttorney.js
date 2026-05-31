/**
 * Internal: set confirmedBeforeProduction true only after verified attorney details are entered.
 * See docs/compliance/legal-launch-checklist.md for production blockers.
 */

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

const RESPONSIBLE_ATTORNEY_PUBLIC_TEXT =
  "Responsible attorney details will be provided in engagement materials and required attorney disclosures before representation begins. This site does not create an attorney-client relationship by itself.";

/** Returns profile safe for public API — never presents unverified license facts. */
export function getPublicResponsibleAttorneyProfile() {
  const profile = responsibleAttorneyProfile;
  const configured = profile.confirmedBeforeProduction;

  return {
    configured,
    displayMode: configured ? "verified_details" : "pending_verified_details",
    publicText: RESPONSIBLE_ATTORNEY_PUBLIC_TEXT,
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
