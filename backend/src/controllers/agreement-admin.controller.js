import { generateAgreementForLead } from "../services/agreement-admin.service.js";

export async function generateAgreementForLeadController(req, res, next) {
  try {
    const { leadId } = req.params;
    const result = await generateAgreementForLead(leadId);

    res.status(result.alreadyExists ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
}
