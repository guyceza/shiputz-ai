-- Fix RLS Policies for Security
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vghfcdtzywbmlacltnjp/sql
-- IMPORTANT: Run this to fix security issues found in audit!

-- 1. USERS TABLE - Should only allow service role or own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users 
  FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 2. VISION_HISTORY - Should only allow own data
ALTER TABLE vision_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own vision history" ON vision_history;
CREATE POLICY "Users see own vision history" ON vision_history 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users insert own vision history" ON vision_history;
CREATE POLICY "Users insert own vision history" ON vision_history 
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users delete own vision history" ON vision_history;
CREATE POLICY "Users delete own vision history" ON vision_history 
  FOR DELETE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Service role full access vision_history" ON vision_history;
CREATE POLICY "Service role full access vision_history" ON vision_history
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 3. USER_SETTINGS - Should only allow own data
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own settings" ON user_settings;
CREATE POLICY "Users see own settings" ON user_settings 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users manage own settings" ON user_settings;
CREATE POLICY "Users manage own settings" ON user_settings 
  FOR ALL USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Service role full access user_settings" ON user_settings;
CREATE POLICY "Service role full access user_settings" ON user_settings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 4. VISUALIZATIONS - Remove permissive policy, use strict RLS
DROP POLICY IF EXISTS "Authenticated users manage visualizations" ON visualizations;

-- Keep only the proper policies
DROP POLICY IF EXISTS "Service role full access visualizations" ON visualizations;
CREATE POLICY "Service role full access visualizations" ON visualizations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

SELECT 'RLS policies fixed! ✅' as status;
