import { logCookieConsent } from "../services/cookie-consent.service.js";
import { cookieConsentLogResponseSchema } from "../schemas/responses/cookie-consent.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getRequestContext } from "../utils/requestContext.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createCookieConsentLogController = asyncHandler(async (req, res) => {
  const { userAgent, ipAddress } = getRequestContext(req);
  const result = await logCookieConsent(req.body, {
    user: req.user,
    userAgent,
    ipAddress,
  });

  sendResponse(
    res,
    cookieConsentLogResponseSchema,
    { ok: true, id: result.id },
    201
  );
});
