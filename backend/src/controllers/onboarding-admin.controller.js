import { generateOnboardingPacketForLead } from "../services/onboarding-admin.service.js";

export async function generateOnboardingPacketForLeadController(req, res, next) {
  try {
    const { leadId } = req.params;
    const result = await generateOnboardingPacketForLead(leadId);

    res.status(result.alreadyExists ? 200 : 201).json(result);
  } catch (error) {
    next(error);
  }
}