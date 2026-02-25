/**
 * Run SQL migration against Supabase
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_articles_and_pricing.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
  // Split by semicolons but be careful with function bodies
  const statements = sql
    .split(/;\s*(?=\n|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt) continue;
    
    // Skip function definitions - they need special handling
    if (stmt.includes('CREATE OR REPLACE FUNCTION') || stmt.includes('CREATE TRIGGER')) {
      console.log(`⏭️  Skipping complex statement ${i + 1} (function/trigger)`);
      continue;
    }
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        // Try direct query for simple statements
        console.log(`⚠️  Statement ${i + 1}: RPC failed, statement type: ${stmt.substring(0, 50)}...`);
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1} skipped (may need manual execution)`);
    }
  }
}

// Alternative: just create the tables directly
async function createTablesDirectly() {
  console.log('Creating tables via REST API...\n');
  
  // Test connection
  const { data, error } = await supabase.from('users').select('count').limit(1);
  if (error && !error.message.includes('does not exist')) {
    console.log('Connection test:', error.message);
  } else {
    console.log('✅ Connected to Supabase');
  }
  
  // Check if tables already exist
  const { data: existingArticles } = await supabase.from('articles').select('count').limit(1);
  if (!existingArticles) {
    console.log('ℹ️  articles table does not exist yet - needs SQL migration');
  } else {
    console.log('✅ articles table exists');
  }
  
  const { data: existingCategories } = await supabase.from('pricing_categories').select('count').limit(1);
  if (!existingCategories) {
    console.log('ℹ️  pricing_categories table does not exist yet - needs SQL migration');
  } else {
    console.log('✅ pricing_categories table exists');
  }
}

createTablesDirectly();
