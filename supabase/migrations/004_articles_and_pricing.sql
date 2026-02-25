-- Migration: Articles and Pricing Data
-- This migrates hardcoded data from articles.ts and pricing-data.ts to Supabase

-- =============================================================================
-- ARTICLES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  category TEXT NOT NULL,
  reading_time INTEGER NOT NULL DEFAULT 5,
  content TEXT NOT NULL,
  related_slugs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- RLS policies
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Anyone can read articles
CREATE POLICY "Articles are publicly readable" ON articles
  FOR SELECT USING (true);

-- =============================================================================
-- PRICING TABLES
-- =============================================================================

-- Main categories (bathroom, kitchen, electrical, etc.)
CREATE TABLE IF NOT EXISTS pricing_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_he TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual pricing items
CREATE TABLE IF NOT EXISTS pricing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES pricing_categories(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name_he TEXT NOT NULL,
  description TEXT,
  min_price INTEGER NOT NULL,
  max_price INTEGER NOT NULL,
  unit TEXT DEFAULT 'unit', -- unit, sqm, meter, etc.
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, key)
);

-- Location multipliers
CREATE TABLE IF NOT EXISTS pricing_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  name_he TEXT NOT NULL,
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_items_category ON pricing_items(category_id);
CREATE INDEX IF NOT EXISTS idx_pricing_categories_key ON pricing_categories(key);

-- RLS policies
ALTER TABLE pricing_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read pricing data
CREATE POLICY "Pricing categories are publicly readable" ON pricing_categories
  FOR SELECT USING (true);

CREATE POLICY "Pricing items are publicly readable" ON pricing_items
  FOR SELECT USING (true);

CREATE POLICY "Pricing locations are publicly readable" ON pricing_locations
  FOR SELECT USING (true);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get all pricing data as formatted text for AI prompts
CREATE OR REPLACE FUNCTION get_pricing_reference()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := '';
  cat RECORD;
  item RECORD;
BEGIN
  result := E'מחירי שוק מתוך מידרג (Midrag.co.il) - 2,837,136 ביקורות על 11,705 בעלי מקצוע:\n\n';
  
  FOR cat IN SELECT * FROM pricing_categories ORDER BY sort_order
  LOOP
    result := result || '=== ' || cat.name_he || ' ===' || E'\n';
    
    FOR item IN 
      SELECT * FROM pricing_items 
      WHERE category_id = cat.id 
      ORDER BY sort_order
    LOOP
      result := result || '• ' || item.name_he || ': ₪' || item.min_price || '-' || item.max_price;
      IF item.unit = 'sqm' THEN
        result := result || '/מ"ר';
      ELSIF item.unit = 'unit' THEN
        result := result || '/יח''';
      END IF;
      result := result || E'\n';
    END LOOP;
    
    result := result || E'\n';
  END LOOP;
  
  -- Add location multipliers
  result := result || E'=== מכפילי מיקום ===\n';
  FOR item IN SELECT * FROM pricing_locations ORDER BY multiplier DESC
  LOOP
    result := result || item.name_he || ': x' || item.multiplier || ' | ';
  END LOOP;
  
  RETURN result;
END;
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
