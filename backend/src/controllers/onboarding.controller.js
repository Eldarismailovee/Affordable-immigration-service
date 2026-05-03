import { getOnboardingPacketByLeadId } from "../services/onboarding-document.service.js";

export async function getOnboardingPacketController(req, res, next) {
  try {
    const { leadId } = req.params;
    const onboarding = await getOnboardingPacketByLeadId(leadId);

    if (!onboarding) {
      return res.status(404).json({
        message: "Onboarding packet not found",
      });
    }

    res.json({ onboarding });
  } catch (error) {
    next(error);
  }
}
