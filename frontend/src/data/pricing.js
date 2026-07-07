const pricing = [
  {
    id: "guidance",
    name: "Attorney Guidance",
    minPrice: 1000,
    maxPrice: 1500,
    badge: "Client files",
    description:
      "Attorney-reviewed guidance for accepted family petition matters.",
    bullets: [
      "Attorney review of prepared packet",
      "Family-petition guidance and instructions",
      "Client files with USCIS",
      "Subject to attorney review and acceptance",
    ],
  },
  {
    id: "filing",
    name: "Attorney-prepared filing package",
    minPrice: 2000,
    maxPrice: 2500,
    badge: "Subject to attorney review",
    featured: true,
    description:
      "For accepted matters where the firm reviews and prepares the filing package based on the confirmed scope.",
    bullets: [
      "Attorney prepares filing package",
      "Office files documents for accepted matters",
      "Case coordination and document review",
      "Preparation target after acceptance and complete required documents",
    ],
  },
  {
    id: "addons",
    name: "Additional forms / add-ons",
    flatFee: 500,
    badge: "Optional",
    description:
      "Some cases require additional forms, evidence, translations, or third-party services. These are reviewed and priced separately before work begins.",
    bullets: [
      "Each additional I-130: +$500",
      "Expedited internal preparation: +$500",
      "Priced separately before work begins",
      "Added after package selection",
    ],
  },
];

export default pricing;
