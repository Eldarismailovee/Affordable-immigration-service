import { getAgreementByLeadId } from "../services/agreement-document.service.js";
import { agreementResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const getAgreementByLeadController = asyncHandler(async (req, res) => {
  const { leadId } = req.params;
  const agreement = await getAgreementByLeadId(leadId, req.user);
  sendResponse(res, agreementResponseSchema, { agreement });
});
