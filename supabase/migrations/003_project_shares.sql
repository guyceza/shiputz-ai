-- Project shares table for sharing projects with read-only links
CREATE TABLE IF NOT EXISTS project_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  share_token VARCHAR(32) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_project_share UNIQUE (project_id)
);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_project_shares_token ON project_shares(share_token);

-- RLS policies
ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own project shares
CREATE POLICY "Users can manage their project shares"
ON project_shares
FOR ALL
USING (
  project_id IN (
    SELECT id FROM projects WHERE user_id = auth.uid()
  )
);

-- Allow anyone to read shares (for viewing shared projects)
CREATE POLICY "Anyone can read valid shares"
ON project_shares
FOR SELECT
USING (true);
