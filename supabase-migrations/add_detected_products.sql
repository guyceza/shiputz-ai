-- Add detected_products column to vision_history table
-- Run this in Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE vision_history 
ADD COLUMN IF NOT EXISTS detected_products JSONB DEFAULT NULL;

-- Add to visualizations table too (for backward compatibility)
ALTER TABLE visualizations 
ADD COLUMN IF NOT EXISTS detected_products JSONB DEFAULT NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_vision_history_detected_products 
ON vision_history USING GIN (detected_products) 
WHERE detected_products IS NOT NULL;

SELECT 'detected_products column added! ✅' as status;
