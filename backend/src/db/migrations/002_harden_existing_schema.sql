CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE intakes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE onboarding_packets
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE docketwise_sync
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status INTEGER,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  ALTER TABLE admin_audit_log
    ADD CONSTRAINT admin_audit_log_method_check CHECK (method IN ('POST', 'PUT', 'PATCH', 'DELETE'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE admin_audit_log
    ADD CONSTRAINT admin_audit_log_status_check CHECK (status IS NULL OR (status >= 100 AND status <= 599));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'disabled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE leads
    ADD CONSTRAINT leads_status_check CHECK (status IN ('new', 'reviewing', 'contacted', 'converted', 'closed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_selected_package_check CHECK (selected_package IN ('guidance', 'filing'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_additional_i130_count_check CHECK (additional_i130_count >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_pricing_min_check CHECK (pricing_min >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_pricing_max_check CHECK (pricing_max >= pricing_min);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_agreement_status_check CHECK (agreement_status IN ('previewed', 'generated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_booking_status_check CHECK (booking_status IN ('requested', 'scheduled', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_payment_status_check CHECK (payment_status IN ('pending_manual_processing', 'payment_requested', 'invoice_sent', 'paid', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE intakes
    ADD CONSTRAINT intakes_docketwise_status_check CHECK (docketwise_status IN ('not_synced', 'synced', 'error'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE agreements
    ADD CONSTRAINT agreements_status_check CHECK (status IN ('generated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE onboarding_packets
    ADD CONSTRAINT onboarding_packets_status_check CHECK (status IN ('generated'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE bookings
    ADD CONSTRAINT bookings_consultation_type_check CHECK (consultation_type IN ('Zoom', 'Phone'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check CHECK (status IN ('requested', 'scheduled', 'completed', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE payments
    ADD CONSTRAINT payments_amount_min_check CHECK (amount_min >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE payments
    ADD CONSTRAINT payments_amount_max_check CHECK (amount_max >= amount_min);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE payments
    ADD CONSTRAINT payments_status_check CHECK (status IN ('pending_manual_processing', 'payment_requested', 'invoice_sent', 'paid', 'failed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE payments
    ADD CONSTRAINT payments_payment_preference_check CHECK (
      payment_preference IS NULL OR payment_preference IN ('invoice', 'office_call', 'manual_follow_up')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE docketwise_sync
    ADD CONSTRAINT docketwise_sync_status_check CHECK (status IN ('not_synced', 'synced', 'error'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE site_settings
    ADD CONSTRAINT site_settings_language_mode_check CHECK (language_mode IN ('english', 'bilingual'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower_active ON users (LOWER(email)) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(role) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_active_created ON leads(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_active_user_created ON leads(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_intakes_lead_id ON intakes(lead_id);
CREATE INDEX IF NOT EXISTS idx_agreements_lead_id ON agreements(lead_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_packets_lead_id ON onboarding_packets(lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON bookings(lead_id);
CREATE INDEX IF NOT EXISTS idx_payments_lead_id ON payments(lead_id);
CREATE INDEX IF NOT EXISTS idx_docketwise_sync_lead_id ON docketwise_sync(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_docketwise_sync_external_id ON docketwise_sync(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_audit_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS leads_set_updated_at ON leads;
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS intakes_set_updated_at ON intakes;
CREATE TRIGGER intakes_set_updated_at
  BEFORE UPDATE ON intakes
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS agreements_set_updated_at ON agreements;
CREATE TRIGGER agreements_set_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS onboarding_packets_set_updated_at ON onboarding_packets;
CREATE TRIGGER onboarding_packets_set_updated_at
  BEFORE UPDATE ON onboarding_packets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS bookings_set_updated_at ON bookings;
CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS payments_set_updated_at ON payments;
CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS docketwise_sync_set_updated_at ON docketwise_sync;
CREATE TRIGGER docketwise_sync_set_updated_at
  BEFORE UPDATE ON docketwise_sync
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON site_settings;
CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
