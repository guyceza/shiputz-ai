-- Bug fixes migration - 2026-02-24

-- Bug #33: Add index on vision_usage_month for faster queries
CREATE INDEX IF NOT EXISTS idx_users_vision_month ON users(vision_usage_month);

-- Bug #34: Add index on visualizations user_id for faster history queries
CREATE INDEX IF NOT EXISTS idx_visualizations_user_id ON visualizations(user_id);

-- Bug #9: Add RPC function for atomic vision usage increment
CREATE OR REPLACE FUNCTION increment_vision_usage(user_email TEXT, current_month TEXT)
RETURNS TABLE(vision_usage_count INT) AS $$
BEGIN
  -- Atomically increment vision_usage_count
  RETURN QUERY
  UPDATE users 
  SET 
    vision_usage_count = COALESCE(vision_usage_count, 0) + 1,
    vision_usage_month = current_month
  WHERE email = user_email
  RETURNING vision_usage_count;
END;
$$ LANGUAGE plpgsql;

-- Bug #10: Add columns to email_sequences for idempotency tracking
ALTER TABLE email_sequences 
ADD COLUMN IF NOT EXISTS run_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resend_id TEXT,
ADD COLUMN IF NOT EXISTS error TEXT,
ADD COLUMN IF NOT EXISTS reason TEXT;

-- Create unique constraint for idempotency (user_email + sequence_type + day_number)
ALTER TABLE email_sequences 
DROP CONSTRAINT IF EXISTS email_sequences_unique_send;
ALTER TABLE email_sequences 
ADD CONSTRAINT email_sequences_unique_send 
UNIQUE (user_email, sequence_type, day_number);

-- Bug #39: Add refunded_at column for refund tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;

-- Add index for refund lookups
CREATE INDEX IF NOT EXISTS idx_users_refunded ON users(refunded_at) WHERE refunded_at IS NOT NULL;
