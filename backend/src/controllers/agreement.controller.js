import { generateAgreement } from "../services/agreement.service.js";

export function generateAgreementController(req, res) {
  const agreement = generateAgreement(req.body);
  res.json(agreement);
}