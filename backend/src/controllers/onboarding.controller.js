import { getOnboardingPacketByLeadId } from "../services/onboarding-document.service.js";
import { onboardingPacketResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const getOnboardingPacketController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const onboarding = await getOnboardingPacketByLeadId(leadId, req.user);
  sendResponse(res, onboardingPacketResponseSchema, { onboarding });
});
