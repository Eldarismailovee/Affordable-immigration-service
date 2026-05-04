import { getSiteSettings, updateSiteSettings } from "../services/site-settings.service.js";
import { siteSettingsResponseSchema } from "../schemas/response.schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";

export const getSiteSettingsController = asyncHandler(async (_req, res) => {
  const settings = await getSiteSettings();
  sendResponse(res, siteSettingsResponseSchema, { settings });
});

export const updateSiteSettingsController = asyncHandler(async (req, res) => {
  const settings = await updateSiteSettings(req.body, req.user);
  sendResponse(res, siteSettingsResponseSchema, { settings });
});
