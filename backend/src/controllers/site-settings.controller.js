import { getSiteSettings, updateSiteSettings } from "../services/site-settings.service.js";

export async function getSiteSettingsController(req, res, next) {
  try {
    const settings = await getSiteSettings();
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSiteSettingsController(req, res, next) {
  try {
    const settings = await updateSiteSettings(req.body);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}
