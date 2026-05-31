import { assertProcessingNotRestricted } from "../domain/processing.policy.js";
import { generateAgreement } from "../services/agreement.service.js";
import { agreementPreviewResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const generateAgreementController = asyncHandler((req, res) => {
  assertProcessingNotRestricted(req.user);
  const agreement = generateAgreement(req.body);
  sendResponse(res, agreementPreviewResponseSchema, agreement);
});
