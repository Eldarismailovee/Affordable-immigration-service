import { randomUUID } from "crypto";
import pool from "../db/pool.js";

const DEFAULT_SETTINGS = {
  firm_name: "Immigration Law Firm",
  phone: "(555) 123-4567",
  email: "info@immigrationfirm.com",
  office_mode: "Zoom / phone only",
  address: "",
  logo_url: "/images/logo.png",
  hero_image_url: "/images/la-skyline.jpg",
  services_image_url: "/images/family-immigration.jpg",
  office_image_url: "/images/ny-office.jpg",
  language_mode: "english",
};

export async function getSiteSettings() {
  const { rows } = await pool.query(`
    SELECT *
    FROM site_settings
    ORDER BY updated_at DESC
    LIMIT 1
  `);

  if (rows.length === 0) {
    const id = randomUUID();

    const insert = await pool.query(
      `
      INSERT INTO site_settings (
        id,
        firm_name,
        phone,
        email,
        office_mode,
        address,
        logo_url,
        hero_image_url,
        services_image_url,
        office_image_url,
        language_mode,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()
      )
      RETURNING *
      `,
      [
        id,
        DEFAULT_SETTINGS.firm_name,
        DEFAULT_SETTINGS.phone,
        DEFAULT_SETTINGS.email,
        DEFAULT_SETTINGS.office_mode,
        DEFAULT_SETTINGS.address,
        DEFAULT_SETTINGS.logo_url,
        DEFAULT_SETTINGS.hero_image_url,
        DEFAULT_SETTINGS.services_image_url,
        DEFAULT_SETTINGS.office_image_url,
        DEFAULT_SETTINGS.language_mode,
      ]
    );

    return insert.rows[0];
  }

  return rows[0];
}

export async function updateSiteSettings(payload) {
  const current = await getSiteSettings();

  const values = {
    firm_name: payload.firm_name ?? current.firm_name,
    phone: payload.phone ?? current.phone,
    email: payload.email ?? current.email,
    office_mode: payload.office_mode ?? current.office_mode,
    address: payload.address ?? current.address,
    logo_url: payload.logo_url ?? current.logo_url,
    hero_image_url: payload.hero_image_url ?? current.hero_image_url,
    services_image_url: payload.services_image_url ?? current.services_image_url,
    office_image_url: payload.office_image_url ?? current.office_image_url,
    language_mode: payload.language_mode ?? current.language_mode,
  };

  const { rows } = await pool.query(
    `
    UPDATE site_settings
    SET
      firm_name = $2,
      phone = $3,
      email = $4,
      office_mode = $5,
      address = $6,
      logo_url = $7,
      hero_image_url = $8,
      services_image_url = $9,
      office_image_url = $10,
      language_mode = $11,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [
      current.id,
      values.firm_name,
      values.phone,
      values.email,
      values.office_mode,
      values.address,
      values.logo_url,
      values.hero_image_url,
      values.services_image_url,
      values.office_image_url,
      values.language_mode,
    ]
  );

  return rows[0];
}
