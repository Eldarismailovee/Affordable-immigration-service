const pricing = [
  {
    id: "guidance",
    name: "Attorney Guidance",
    minPrice: 1000,
    maxPrice: 1500,
    badge: "Client files",
    description:
      "Attorney-reviewed and prepared guidance for family petitions.",
    bullets: [
      "Attorney review of prepared packet",
      "Family-petition guidance and instructions",
      "Client files with USCIS",
      "Government filing fees are separate",
    ],
  },
  {
    id: "filing",
    name: "Attorney Filing",
    minPrice: 2000,
    maxPrice: 2500,
    badge: "Most popular",
    featured: true,
    description:
      "Attorney-prepared and attorney-filed package for end-to-end support.",
    bullets: [
      "Attorney prepares filing package",
      "Office files documents for you",
      "Case coordination and document review",
      "Government filing fees are separate",
    ],
  },
  {
    id: "addons",
    name: "Add-ons",
    flatFee: 500,
    badge: "Flexible options",
    description:
      "Customize your case with additional petitions and expedited processing.",
    bullets: [
      "Each additional I-130: +$500",
      "Expedited firm processing: +$500",
      "A la carte structure",
      "Added after package selection",
    ],
  },
];

export default pricing;