-- Lead workflow v2: new/engaged statuses, conflict check, attorney review fields.

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

UPDATE leads
SET status = CASE status
  WHEN 'prospective' THEN 'new'
  WHEN 'new' THEN 'new'
  WHEN 'conflict_check' THEN 'conflict_check'
  WHEN 'attorney_review' THEN 'attorney_review'
  WHEN 'accepted' THEN 'accepted'
  WHEN 'declined' THEN 'declined'
  WHEN 'engaged' THEN 'engaged'
  WHEN 'filed' THEN 'filed'
  ELSE 'new'
END;

ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new';

DO $$
BEGIN
  ALTER TABLE leads
    ADD CONSTRAINT leads_status_check CHECK (status IN (
      'new',
      'conflict_check',
      'attorney_review',
      'accepted',
      'declined',
      'engaged',
      'filed'
    ));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS attorney_review_status TEXT,
  ADD COLUMN IF NOT EXISTS attorney_reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attorney_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attorney_review_notes TEXT,
  ADD COLUMN IF NOT EXISTS responsible_attorney_confirmed BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  ALTER TABLE leads
    ADD CONSTRAINT leads_attorney_review_status_check CHECK (
      attorney_review_status IS NULL
      OR attorney_review_status IN ('pending', 'accepted', 'declined')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS lead_conflict_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
  potential_client_name TEXT NOT NULL,
  potential_client_email TEXT NOT NULL,
  opposing_party_names TEXT[] NOT NULL DEFAULT '{}',
  related_person_names TEXT[] NOT NULL DEFAULT '{}',
  case_summary TEXT,
  matter_type TEXT NOT NULL,
  jurisdiction_or_location TEXT,
  notes TEXT,
  result TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lead_conflict_checks_result_check CHECK (
    result IN ('pending', 'clear', 'conflict_found', 'needs_more_info')
  )
);

CREATE INDEX IF NOT EXISTS idx_lead_conflict_checks_lead_id ON lead_conflict_checks(lead_id);

ALTER TABLE intakes
  ADD COLUMN IF NOT EXISTS legal_recommendation_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS legal_recommendation_approved_at TIMESTAMPTZ;
