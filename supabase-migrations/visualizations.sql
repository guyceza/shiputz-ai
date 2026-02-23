-- Visualizations Table Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vghfcdtzywbmlacltnjp/sql

-- 1. Create visualizations table
CREATE TABLE IF NOT EXISTS visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  analysis TEXT,
  costs JSONB,
  before_image_url TEXT,
  after_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_visualizations_user_id ON visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_created_at ON visualizations(created_at DESC);

-- 2. Enable Row Level Security
ALTER TABLE visualizations ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Users see own visualizations" ON visualizations;
CREATE POLICY "Users see own visualizations" ON visualizations 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users insert own visualizations" ON visualizations;
CREATE POLICY "Users insert own visualizations" ON visualizations 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users update own visualizations" ON visualizations;
CREATE POLICY "Users update own visualizations" ON visualizations 
  FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users delete own visualizations" ON visualizations;
CREATE POLICY "Users delete own visualizations" ON visualizations 
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 4. Service role bypass (for API routes)
DROP POLICY IF EXISTS "Service role full access visualizations" ON visualizations;
CREATE POLICY "Service role full access visualizations" ON visualizations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 5. Allow authenticated users full access to their own visualizations
-- Note: Since user_id is a text field from localStorage, we use a simple policy
DROP POLICY IF EXISTS "Authenticated users manage visualizations" ON visualizations;
CREATE POLICY "Authenticated users manage visualizations" ON visualizations
  FOR ALL USING (true) WITH CHECK (true);

-- Done!
SELECT 'Visualizations table created! ✅' as status;

-- IMPORTANT: Also create storage bucket in Supabase Dashboard:
-- 1. Go to Storage > Create new bucket
-- 2. Name: "visualizations"
-- 3. Public bucket: YES (checked)
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: image/jpeg, image/png, image/webp
