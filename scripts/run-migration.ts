/**
 * Run PostgreSQL migration using stored credentials
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const credentials = {
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  user: 'postgres.vghfcdtzywbmlacltnjp',
  password: 'H3jvNMUKFtVdDxSJ',
  database: 'postgres',
  port: 6543,
  ssl: { rejectUnauthorized: false }
};

async function main() {
  console.log('🔧 Running PostgreSQL Migration\n');
  
  const client = new Client(credentials);
  
  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL!\n');
    
    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_articles_and_pricing.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration SQL...');
    
    // Execute each statement separately to handle errors gracefully
    const statements = sql.split(/;\s*\n/).filter(s => s.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      
      try {
        await client.query(stmt);
        // Don't log every statement, just progress
        if ((i + 1) % 5 === 0) {
          process.stdout.write('.');
        }
      } catch (err: any) {
        if (err.message?.includes('already exists')) {
          // Ignore "already exists" errors
        } else if (err.message?.includes('duplicate key')) {
          // Ignore duplicate key errors
        } else {
          console.log(`\n⚠️  Statement ${i + 1}: ${err.message?.substring(0, 80)}`);
        }
      }
    }
    
    console.log('\n\n✅ Migration completed!\n');
    
    // Verify tables exist
    console.log('Verifying tables:');
    const tables = ['articles', 'pricing_categories', 'pricing_items', 'pricing_locations'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`  ✅ ${table}: exists (${result.rows[0].count} rows)`);
      } catch (err) {
        console.log(`  ❌ ${table}: does not exist`);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
