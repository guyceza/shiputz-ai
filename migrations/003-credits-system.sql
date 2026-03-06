-- Credit System Migration
-- Run against Supabase SQL Editor

-- Add plan columns to users table (if not exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMPTZ;

-- Ensure viz_credits exists (should already from earlier migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS viz_credits INTEGER DEFAULT 0;

-- Credit transactions log
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  amount INTEGER NOT NULL,  -- positive = added, negative = spent
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_email ON credit_transactions(user_email);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- Migrate existing users: anyone with purchased=true and no plan gets 'pro'
UPDATE users SET plan = 'pro', viz_credits = GREATEST(viz_credits, 200)
WHERE purchased = true AND (plan IS NULL OR plan = 'free');
