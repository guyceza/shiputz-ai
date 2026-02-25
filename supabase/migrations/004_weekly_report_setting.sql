-- Add weekly report setting to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN DEFAULT false;

-- Also add to users table for the report query
ALTER TABLE users
ADD COLUMN IF NOT EXISTS weekly_report_enabled BOOLEAN DEFAULT false;
