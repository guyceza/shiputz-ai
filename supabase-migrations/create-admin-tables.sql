-- Create banned_users table
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trial_resets table
CREATE TABLE IF NOT EXISTS trial_resets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_banned_users_email ON banned_users(email);
CREATE INDEX IF NOT EXISTS idx_trial_resets_email ON trial_resets(email);
CREATE INDEX IF NOT EXISTS idx_trial_resets_used ON trial_resets(used);

-- Enable RLS
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_resets ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access" ON banned_users FOR ALL USING (true);
CREATE POLICY "Service role full access" ON trial_resets FOR ALL USING (true);
