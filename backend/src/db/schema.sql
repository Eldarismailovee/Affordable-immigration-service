CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intakes (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  selected_package TEXT NOT NULL,
  case_type TEXT NOT NULL,
  notes TEXT DEFAULT '',
  additional_i130_count INTEGER NOT NULL DEFAULT 0,
  expedited BOOLEAN NOT NULL DEFAULT FALSE,
  pricing_min INTEGER NOT NULL,
  pricing_max INTEGER NOT NULL,
  agreement_status TEXT NOT NULL DEFAULT 'previewed',
  booking_status TEXT NOT NULL DEFAULT 'requested',
  payment_status TEXT NOT NULL DEFAULT 'pending_manual_processing',
  docketwise_status TEXT NOT NULL DEFAULT 'not_synced',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_packets (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  consultation_type TEXT NOT NULL,
  preferred_date_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  amount_min INTEGER NOT NULL,
  amount_max INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_manual_processing',
  manual_review BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT DEFAULT '',
  billing_name TEXT,
  billing_email TEXT,
  payment_preference TEXT,
  consent_manual_processing BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS docketwise_sync (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'not_synced',
  error_message TEXT,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY,
  firm_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  office_mode TEXT NOT NULL DEFAULT 'Zoom / phone only',
  address TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  services_image_url TEXT DEFAULT '',
  office_image_url TEXT DEFAULT '',
  language_mode TEXT NOT NULL DEFAULT 'english',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intakes_lead_id ON intakes(lead_id);
CREATE INDEX IF NOT EXISTS idx_agreements_lead_id ON agreements(lead_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_packets_lead_id ON onboarding_packets(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_docketwise_sync_lead_id ON docketwise_sync(lead_id);
