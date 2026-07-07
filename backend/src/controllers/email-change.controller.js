import { requestEmailChange } from "../services/email-change.service.js";
import { messageResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { getRequestContext } from "../utils/requestContext.js";

export const changeEmailController = asyncHandler(async (req, res) => {
  const result = await requestEmailChange({
    user: req.user,
    newEmail: req.body.email,
    password: req.body.password,
    mfaCompleted: Boolean(req.auth?.mfa),
    requestContext: getRequestContext(req),
  });

  sendResponse(res, messageResponseSchema, result);
});
