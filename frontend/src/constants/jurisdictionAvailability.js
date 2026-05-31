import services from "../data/services.js";

/** Bump when availability disclosures change materially. */
export const JURISDICTION_AVAILABILITY_VERSION = "2026-05-31-v1";

export const PRODUCTION_CONFIRMATION_TODO =
  "TODO: Confirm responsible attorney name, licensed jurisdiction(s), bar number if required, and accepted matter types before production launch.";

export const JURISDICTION_REVIEW_TODO =
  "TODO: Have jurisdiction availability language reviewed by responsible attorney before production launch.";

export const STATE_BAR_RULES_TODO =
  "TODO: Check each applicable state bar advertising and unauthorized-practice rules before production launch.";

export const ADVERTISING_LABELS_TODO =
  "TODO: Confirm whether state-specific advertising labels/disclaimers are required.";

export const WORKFLOW_TODO =
  "TODO: Connect availability disclosures to attorney review/lead acceptance workflow.";

export const attorneyLicenses = [
  {
    jurisdiction: "TODO",
    licenseType: "Attorney",
    barNumber: "TODO",
    status: "TODO confirm",
    notes: "TODO: Confirm with responsible attorney before production launch.",
  },
];

/** Mapped from existing family-petition services; each requires attorney review before acceptance. */
export const acceptedMatters = services.map((label) => ({
  key: label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, ""),
  label,
  status: "review_required",
  notes: "Accepted only after attorney review and conflict check.",
}));

export const unavailableMatters = [
  {
    key: "criminal_defense",
    label: "Criminal defense",
    reason: "Not offered through this platform.",
  },
  {
    key: "employment_based_immigration",
    label: "Employment-based immigration",
    reason: "Not currently offered through this intake flow. Contact the firm to discuss.",
  },
  {
    key: "deportation_removal",
    label: "Deportation / removal defense",
    reason: "Not offered through this platform.",
  },
];

export const unavailableJurisdictions = [
  {
    jurisdiction: "TODO",
    reason: "TODO: Confirm jurisdiction restrictions with responsible attorney before production launch.",
  },
];

export const availabilityDisclaimers = {
  attorneyReviewRequired:
    "Submitting an intake form or contacting us does not mean your matter has been accepted. We must first complete conflict checks, verify that the responsible attorney is authorized to assist with your matter, and confirm the scope of services in writing.",
  notLegalAdviceBeforeReview:
    "General information on this website is for informational purposes only and is not legal advice. Legal advice is provided only after attorney review and after an attorney-client relationship is established through an engagement agreement or other written confirmation.",
  jurisdictionLimitation:
    "Legal services are available only where the responsible attorney is licensed, authorized, or otherwise permitted to provide the service. Availability may depend on your location, the type of matter, forum rules, federal immigration practice rules, and applicable professional responsibility requirements.",
  noGuarantee:
    "We do not guarantee any immigration benefit, filing outcome, government processing time, or result. Government agencies make their own decisions based on applicable law and the facts of each case.",
  advertisingNotice:
    "This website may be considered attorney advertising in some jurisdictions.",
  intakeAcknowledgment:
    "I understand that submitting this form does not create an attorney-client relationship and that my matter must be reviewed before acceptance.",
  caseTypeHelper:
    "Availability depends on attorney review, jurisdiction, and matter type.",
};

/**
 * Returns the first unavailable matter that appears to match free-text case type input.
 * YAGNI: simple substring match only — no eligibility engine.
 */
export function findUnavailableMatterMatch(caseTypeText) {
  const normalized = String(caseTypeText || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return (
    unavailableMatters.find((matter) => {
      const label = matter.label.toLowerCase();
      const keyPhrase = matter.key.replace(/_/g, " ");
      return normalized.includes(label) || normalized.includes(keyPhrase);
    }) ?? null
  );
}
