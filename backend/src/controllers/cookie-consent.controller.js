import { logCookieConsent } from "../services/cookie-consent.service.js";
import { cookieConsentLogResponseSchema } from "../schemas/responses/cookie-consent.response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isGpcSignalActive } from "../utils/gpc.js";
import { getRequestContext } from "../utils/requestContext.js";
import { sendResponse } from "../utils/sendResponse.js";

export const createCookieConsentLogController = asyncHandler(async (req, res) => {
  const { userAgent, ipAddress } = getRequestContext(req);
  const payload = { ...req.body };

  if (isGpcSignalActive(req)) {
    payload.gpcActive = true;
    payload.marketing = false;
    payload.analytics = false;
    if (payload.source !== "gpc") {
      payload.source = "gpc";
    }
  }

  const result = await logCookieConsent(payload, {
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
