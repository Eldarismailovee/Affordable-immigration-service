ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'payment_link',
  ADD COLUMN IF NOT EXISTS hosted_payment_url TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference TEXT,
  ADD COLUMN IF NOT EXISTS notes_redacted BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_payment_method_check'
  ) THEN
    ALTER TABLE payments
      ADD CONSTRAINT payments_payment_method_check CHECK (
        payment_method IN ('payment_link')
      );
  END IF;
END $$;
