import { getPublicResponsibleAttorneyProfile } from "./responsibleAttorney.js";

/**
 * TODO: Confirm responsible attorney name, licensed jurisdiction(s), bar number,
 * experience years, real reviews, and team photos before publishing those claims.
 */

export const heroTrustSignals = [
  {
    label: "Attorney-reviewed",
    description: "Legal recommendations are not finalized until attorney review.",
  },
  {
    label: "Family-based petitions",
    description: "Focused on family immigration matters accepted by the firm.",
  },
  {
    label: "Transparent flat fees",
    description: "Pricing is explained before paid work begins.",
  },
  {
    label: "Secure document upload",
    description: "Designed for sensitive immigration documents.",
  },
  {
    label: "Acceptance required",
    description: "No attorney-client relationship until accepted in writing.",
  },
];

export const heroCopy = {
  eyebrow: "Family-based immigration petitions",
  headline: "Find out if your family immigration matter",
  headlineAccent: "may be a fit",
  subheadline:
    "Answer a few basic questions first. If your matter may be a fit, we explain pricing, document needs, attorney review, and next steps before you continue.",
  primaryCta: { label: "Start case review", to: "/case-review" },
  secondaryCta: { label: "View pricing", to: "#pricing" },
  notice:
    "No legal advice or attorney-client relationship is formed until the firm reviews and accepts your matter in writing.",
};

export const beforeYouStartPoints = [
  {
    icon: "time",
    text: "The first step is designed to take only a few minutes.",
  },
  {
    icon: "documents",
    text: "No passport or financial documents are needed at the first step.",
  },
  {
    icon: "pricing",
    text: "Pricing is available before paid work begins.",
  },
  {
    icon: "attorney",
    text: "Attorney review is required before legal advice or filing recommendations.",
  },
];

export const preIntakeClarityCopy = {
  documents: {
    title: "What you need now",
    text: "You do not need to upload passports or financial documents to start the basic case review. If the matter may be a fit, we will explain which documents are needed and why.",
  },
  payment: {
    title: "Payment clarity",
    text: "You can view pricing before starting. Payment is not requested until the service scope and next steps are clear. Any required payment is shown clearly before checkout. Government fees and third-party fees are explained separately where applicable.",
  },
};

export const caseReviewProcessSteps = [
  {
    title: "Basic fit check",
    text: "We ask a few questions about your family relationship, location, and goal.",
  },
  {
    title: "Conflict and jurisdiction review",
    text: "The firm checks whether it can review or accept the matter.",
  },
  {
    title: "Attorney review",
    text: "A responsible attorney reviews the matter before legal advice, agreement generation, filing packet generation, or legal recommendations.",
  },
  {
    title: "Clear next steps and pricing",
    text: "If accepted, you receive the scope, fees, document requests, and next steps in writing.",
  },
];

export const whyTrustCards = [
  {
    title: "Attorney review before legal advice",
    text: "We do not treat your intake as automatic representation. Your information is reviewed for conflicts, jurisdiction availability, and scope before the firm accepts your matter.",
  },
  {
    title: "Family-based focus",
    text: "This platform is built for family immigration petition support, subject to attorney review and jurisdiction availability.",
  },
  {
    title: "Secure document handling",
    text: "Your documents may include passports, financial records, and family information. Upload flows require authentication and access is limited to authorized staff.",
  },
  {
    title: "Transparent flat fees",
    text: "Package pricing is shown before you commit to paid work. Government and third-party fees are explained separately where applicable.",
  },
  {
    title: "Clear acceptance process",
    text: "Conflict checks, jurisdiction review, and written scope confirmation happen before representation or legal advice begins.",
  },
];

export const afterSubmitSteps = caseReviewProcessSteps.map((step) => step.text);

/** Only claims backed by implemented controls — see Privacy Policy and backend audit logging. */
export const documentSecurityPoints = [
  {
    label: "Authenticated upload flows",
    detail: "Document upload requires a signed-in account rather than anonymous public forms.",
  },
  {
    label: "Restricted staff access",
    detail: "Sensitive intake and documents are available only to authorized firm staff.",
  },
  {
    label: "Security audit logging",
    detail: "Administrative and security-sensitive actions are logged for review.",
  },
  {
    label: "Privacy request support",
    detail: "Data access, correction, and deletion requests can be submitted where legally available.",
  },
];

export const documentSecuritySummary =
  "Your documents may include passports, financial records, and family information. We explain how uploads are handled, limit access to authorized staff, and provide privacy controls for data requests and deletion where legally available.";

export function getAttorneyTrustBadgeLabel() {
  const profile = getPublicResponsibleAttorneyProfile();
  return profile.configured ? "Licensed immigration attorney" : "Attorney review before acceptance";
}
