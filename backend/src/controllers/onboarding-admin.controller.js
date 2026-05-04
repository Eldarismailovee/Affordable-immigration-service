import { generateOnboardingPacketForLead } from "../services/onboarding-admin.service.js";
import { onboardingGenerationResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const generateOnboardingPacketForLeadController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await generateOnboardingPacketForLead({ leadId, actor: req.user });
  sendResponse(
    res,
    onboardingGenerationResponseSchema,
    result,
    result.alreadyExists ? 200 : 201
  );
});
