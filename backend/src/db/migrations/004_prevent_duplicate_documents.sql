CREATE UNIQUE INDEX IF NOT EXISTS uq_agreements_lead_id ON agreements(lead_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_onboarding_packets_lead_id ON onboarding_packets(lead_id);
