-- ShiputzAI Complete Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vghfcdtzywbmlacltnjp/sql

-- 1. Vision Usage Columns (for monitoring)
ALTER TABLE users ADD COLUMN IF NOT EXISTS vision_usage_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vision_usage_month VARCHAR(7);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- 3. Expenses Table (for future - track individual expenses)
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  category TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- 4. Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Projects policies
DROP POLICY IF EXISTS "Users see own projects" ON projects;
CREATE POLICY "Users see own projects" ON projects 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own projects" ON projects;
CREATE POLICY "Users insert own projects" ON projects 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own projects" ON projects;
CREATE POLICY "Users update own projects" ON projects 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own projects" ON projects;
CREATE POLICY "Users delete own projects" ON projects 
  FOR DELETE USING (auth.uid() = user_id);

-- Expenses policies
DROP POLICY IF EXISTS "Users see own expenses" ON expenses;
CREATE POLICY "Users see own expenses" ON expenses 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own expenses" ON expenses;
CREATE POLICY "Users insert own expenses" ON expenses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own expenses" ON expenses;
CREATE POLICY "Users update own expenses" ON expenses 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own expenses" ON expenses;
CREATE POLICY "Users delete own expenses" ON expenses 
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Service role bypass (for API routes)
DROP POLICY IF EXISTS "Service role full access projects" ON projects;
CREATE POLICY "Service role full access projects" ON projects
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access expenses" ON expenses;
CREATE POLICY "Service role full access expenses" ON expenses
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Done!
SELECT 'Migration complete! ✅' as status;
