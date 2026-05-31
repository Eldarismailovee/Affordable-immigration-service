import {
  createSiteSettings,
  findLatestSiteSettings,
  findSiteSettingsById,
  updateSiteSettingsById,
} from "../repositories/site-settings.repository.js";
import { isUniqueViolation } from "../db/errors.js";
import { assertAdminAccess } from "./access.service.js";

const DEFAULT_SITE_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

const DEFAULT_SETTINGS = {
  firmName: "Immigration Law Firm",
  phone: "(555) 123-4567",
  email: "info@immigrationfirm.com",
  officeMode: "Zoom / phone only",
  address: "",
  logoUrl: "/images/logo.png",
  heroImageUrl: "/images/la-skyline.jpg",
  servicesImageUrl: "/images/family-immigration.jpg",
  officeImageUrl: "/images/ny-office.jpg",
  languageMode: "english",
};

export async function getSiteSettings() {
  const existingById = await findSiteSettingsById(DEFAULT_SITE_SETTINGS_ID);

  if (existingById) {
    return existingById;
  }

  const existing = await findLatestSiteSettings();

  if (existing) {
    return existing;
  }

  try {
    return await createSiteSettings({
      id: DEFAULT_SITE_SETTINGS_ID,
      ...DEFAULT_SETTINGS,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return (
        (await findSiteSettingsById(DEFAULT_SITE_SETTINGS_ID)) ??
        (await findLatestSiteSettings())
      );
    }

    throw error;
  }
}

export async function updateSiteSettings(payload, actor) {
  assertAdminAccess(actor);

  const current = await getSiteSettings();

  return updateSiteSettingsById(current.id, {
    firmName: payload.firm_name ?? current.firm_name,
    phone: payload.phone ?? current.phone,
    email: payload.email ?? current.email,
    officeMode: payload.office_mode ?? current.office_mode,
    address: payload.address ?? current.address,
    logoUrl: payload.logo_url ?? current.logo_url,
    heroImageUrl: payload.hero_image_url ?? current.hero_image_url,
    servicesImageUrl: payload.services_image_url ?? current.services_image_url,
    officeImageUrl: payload.office_image_url ?? current.office_image_url,
    languageMode: payload.language_mode ?? current.language_mode,
  });
}
