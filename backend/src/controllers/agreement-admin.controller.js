import { generateAgreementForLead } from "../services/agreement-admin.service.js";
import { agreementGenerationResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const generateAgreementForLeadController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const result = await generateAgreementForLead({ leadId, actor: req.user });
  sendResponse(res, agreementGenerationResponseSchema, result, result.alreadyExists ? 200 : 201);
});
