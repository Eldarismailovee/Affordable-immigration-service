-- Attorney role, lead workflow states, and document packet draft/approval.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users
SET role = 'attorney'
WHERE role NOT IN ('admin', 'user', 'attorney');

DO $$
BEGIN
  ALTER TABLE users
    ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'user', 'attorney'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

UPDATE leads
SET status = CASE status
  WHEN 'new' THEN 'prospective'
  WHEN 'reviewing' THEN 'conflict_check'
  WHEN 'contacted' THEN 'attorney_review'
  WHEN 'converted' THEN 'accepted'
  WHEN 'closed' THEN 'declined'
  ELSE status
END
WHERE status IN ('new', 'reviewing', 'contacted', 'converted', 'closed');

ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'prospective';

DO $$
BEGIN
  ALTER TABLE leads
    ADD CONSTRAINT leads_status_check CHECK (status IN (
      'prospective',
      'conflict_check',
      'attorney_review',
      'accepted',
      'declined',
      'filed'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_status_check;
ALTER TABLE onboarding_packets DROP CONSTRAINT IF EXISTS onboarding_packets_status_check;

UPDATE agreements
SET status = 'draft'
WHERE status = 'generated';

UPDATE onboarding_packets
SET status = 'draft'
WHERE status = 'generated';

ALTER TABLE agreements ALTER COLUMN status SET DEFAULT 'draft';
ALTER TABLE onboarding_packets ALTER COLUMN status SET DEFAULT 'draft';

ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

ALTER TABLE onboarding_packets
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

DO $$
BEGIN
  ALTER TABLE agreements
    ADD CONSTRAINT agreements_status_check CHECK (status IN ('draft', 'approved'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE onboarding_packets
    ADD CONSTRAINT onboarding_packets_status_check CHECK (status IN ('draft', 'approved'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
