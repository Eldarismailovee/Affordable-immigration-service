/**
 * Family matter types shown on the landing page and availability disclosures.
 * Only include matter types confirmed in services.js or marked review_required.
 */

export const whoThisIsForCopy = {
  eyebrow: "Who this is for",
  title: "Family immigration",
  accent: "matters we review",
  subtitle:
    "We focus on family-based immigration matters. Each case is subject to conflict check, jurisdiction availability, attorney review, and written acceptance before legal advice or representation begins.",
  notSureHelper:
    "Not sure which category fits? Start with a short case review. We'll ask a few basic questions before requesting sensitive documents.",
  disclaimer:
    "This section is informational only. It does not mean your case qualifies or that the firm has accepted your matter. Legal advice and representation begin only after attorney review, conflict check, jurisdiction review, and written acceptance.",
  notAvailableHeading: "Not currently handled through this platform",
  notAvailableIntro:
    "Some matters may fall outside the platform's current scope and will be declined or referred only after review.",
  subjectToReview: "Subject to attorney review and written acceptance.",
};

export const familyMatterTypes = [
  {
    key: "spouse_petition",
    title: "Spouse petitions",
    description:
      "For U.S. citizens or lawful permanent residents seeking to petition for a spouse.",
    status: "review_required",
    serviceLabel: "Marriage-based green cards",
  },
  {
    key: "fiance_visa",
    title: "Fiancé(e) visas",
    description:
      "For U.S. citizens seeking K-1 fiancé(e) visa support, if accepted by the firm.",
    status: "review_required",
    serviceLabel: "Fiancé(e) visas",
  },
  {
    key: "parent_petition",
    title: "Parent petitions",
    description:
      "For U.S. citizens seeking to petition for a parent, subject to eligibility and review.",
    status: "review_required",
    serviceLabel: "Parent petitions",
  },
  {
    key: "child_petition",
    title: "Child petitions",
    description:
      "For qualifying parent-child family petitions, subject to eligibility and review.",
    status: "review_required",
    serviceLabel: "Child petitions",
  },
  {
    key: "sibling_petition",
    title: "Sibling petitions",
    description:
      "For U.S. citizens seeking to petition for a brother or sister, subject to review and visa category limits.",
    status: "review_required",
    serviceLabel: "Sibling petitions",
  },
  {
    key: "additional_i130",
    title: "Additional I-130 petitions",
    description:
      "For families who need separate I-130 petitions for additional qualifying relatives.",
    status: "review_required",
    serviceLabel: "Additional I-130 filings",
  },
  {
    key: "adjustment_consular",
    title: "Adjustment of status / consular processing",
    description:
      "Next-step options such as adjustment of status or consular processing are reviewed after basic eligibility and attorney review.",
    status: "review_required",
  },
];
