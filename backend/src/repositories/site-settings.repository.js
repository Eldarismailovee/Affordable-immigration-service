import pool from "../db/pool.js";

export async function findLatestSiteSettings(db = pool) {
  const { rows } = await db.query(
    `
    SELECT *
    FROM site_settings
    ORDER BY updated_at DESC
    LIMIT 1
    `
  );

  return rows[0] || null;
}

export async function createSiteSettings(
  {
    id,
    firmName,
    phone,
    email,
    officeMode,
    address,
    logoUrl,
    heroImageUrl,
    servicesImageUrl,
    officeImageUrl,
    languageMode,
  },
  db = pool
) {
  const { rows } = await db.query(
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
      firmName,
      phone,
      email,
      officeMode,
      address,
      logoUrl,
      heroImageUrl,
      servicesImageUrl,
      officeImageUrl,
      languageMode,
    ]
  );

  return rows[0];
}

export async function updateSiteSettingsById(
  id,
  {
    firmName,
    phone,
    email,
    officeMode,
    address,
    logoUrl,
    heroImageUrl,
    servicesImageUrl,
    officeImageUrl,
    languageMode,
  },
  db = pool
) {
  const { rows } = await db.query(
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
      id,
      firmName,
      phone,
      email,
      officeMode,
      address,
      logoUrl,
      heroImageUrl,
      servicesImageUrl,
      officeImageUrl,
      languageMode,
    ]
  );

  return rows[0] || null;
}
