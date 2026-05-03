import { randomUUID } from "crypto";
import {
  createSiteSettings,
  findLatestSiteSettings,
  updateSiteSettingsById,
} from "../repositories/site-settings.repository.js";

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
  const existing = await findLatestSiteSettings();

  if (existing) {
    return existing;
  }

  return createSiteSettings({
    id: randomUUID(),
    ...DEFAULT_SETTINGS,
  });
}

export async function updateSiteSettings(payload) {
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
