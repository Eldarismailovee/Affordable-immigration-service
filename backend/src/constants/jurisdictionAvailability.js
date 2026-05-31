/** Backend mirror of frontend jurisdiction availability — static config, no geolocation. */

export const JURISDICTION_AVAILABILITY_VERSION = "2026-05-31-v1";

export const licensedJurisdictions = [];

export const acceptedMatterTypes = [
  { key: "marriage_based_green_cards", label: "Marriage-based green cards", status: "review_required" },
  { key: "parent_petitions", label: "Parent petitions", status: "review_required" },
  { key: "child_petitions", label: "Child petitions", status: "review_required" },
  { key: "sibling_petitions", label: "Sibling petitions", status: "review_required" },
  { key: "adjustment_of_status", label: "Adjustment of status", status: "review_required" },
];

export const notAvailableMatterTypes = [
  { key: "criminal_defense", label: "Criminal defense", reason: "Not offered through this platform." },
  {
    key: "employment_based_immigration",
    label: "Employment-based immigration",
    reason: "Not currently offered through this intake flow.",
  },
  { key: "deportation_removal", label: "Deportation / removal defense", reason: "Not offered through this platform." },
];

export const notAvailableJurisdictions = [];

export const availabilityNotes =
  "All availability is subject to attorney review. Unknown jurisdiction or matter type requires review — not automatic acceptance.";

/**
 * @param {{ jurisdiction?: string, matterType?: string }} params
 */
export function evaluateJurisdictionAvailability({ jurisdiction, matterType } = {}) {
  const normalizedMatter = String(matterType || "").trim().toLowerCase();
  const normalizedJurisdiction = String(jurisdiction || "").trim().toLowerCase();

  const blockedMatter = notAvailableMatterTypes.find((matter) => {
    const label = matter.label.toLowerCase();
    const keyPhrase = matter.key.replace(/_/g, " ");
    return (
      normalizedMatter.includes(label) ||
      normalizedMatter.includes(keyPhrase) ||
      normalizedMatter === matter.key.replace(/_/g, " ")
    );
  });

  if (blockedMatter) {
    return {
      available: false,
      reason: blockedMatter.reason,
      reviewRequired: false,
    };
  }

  const blockedJurisdiction = notAvailableJurisdictions.find(
    (entry) =>
      entry.jurisdiction &&
      normalizedJurisdiction &&
      normalizedJurisdiction.includes(entry.jurisdiction.toLowerCase())
  );

  if (blockedJurisdiction) {
    return {
      available: false,
      reason: blockedJurisdiction.reason,
      reviewRequired: false,
    };
  }

  if (!normalizedJurisdiction) {
    return {
      available: false,
      reason: "Jurisdiction unknown — attorney review required before acceptance.",
      reviewRequired: true,
    };
  }

  return {
    available: false,
    reason: "Subject to attorney review for jurisdiction and matter type.",
    reviewRequired: true,
  };
}

export function getPublicAvailabilityConfig() {
  return {
    version: JURISDICTION_AVAILABILITY_VERSION,
    licensedJurisdictions,
    acceptedMatterTypes,
    notAvailableMatterTypes,
    notAvailableJurisdictions,
    notes: availabilityNotes,
    allSubjectToAttorneyReview: true,
  };
}
