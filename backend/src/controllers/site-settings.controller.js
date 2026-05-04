import { getSiteSettings, updateSiteSettings } from "../services/site-settings.service.js";
import { siteSettingsResponseSchema } from "../schemas/response.schema.js";
import { sendResponse } from "../utils/sendResponse.js";

export async function getSiteSettingsController(req, res, next) {
  try {
    const settings = await getSiteSettings();
    sendResponse(res, siteSettingsResponseSchema, { settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSiteSettingsController(req, res, next) {
  try {
    const settings = await updateSiteSettings(req.body);
    sendResponse(res, siteSettingsResponseSchema, { settings });
  } catch (error) {
    next(error);
  }
}
