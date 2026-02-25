/**
 * Direct PostgreSQL migration using Supabase pooler connection
 * Connection: postgresql://postgres.[project-ref]:[password]@[pooler-host]:6543/postgres
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function getPassword(): Promise<string> {
  // Check if password is in env
  const envPassword = process.env.SUPABASE_DB_PASSWORD;
  if (envPassword) return envPassword;
  
  // Otherwise prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter Supabase database password: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔧 Direct PostgreSQL Migration\n');
  
  const projectRef = 'vghfcdtzywbmlacltnjp';
  const password = await getPassword();
  
  if (!password) {
    console.error('❌ No password provided');
    console.log('\nTo get your database password:');
    console.log('1. Go to: https://supabase.com/dashboard/project/vghfcdtzywbmlacltnjp/settings/database');
    console.log('2. Copy the "Database password" (you may need to reset it if you never set one)');
    console.log('\nOr add SUPABASE_DB_PASSWORD to your .env.local file');
    process.exit(1);
  }
  
  const connectionString = `postgresql://postgres.${projectRef}:${password}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;
  
  console.log('Connecting to Supabase PostgreSQL...');
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected!\n');
    
    // Read and execute SQL
    const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_articles_and_pricing.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing migration SQL...\n');
    await client.query(sql);
    console.log('✅ Migration completed!\n');
    
    // Verify tables
    const tables = ['articles', 'pricing_categories', 'pricing_items', 'pricing_locations'];
    console.log('Verifying tables:');
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`  ✅ ${table}: ${result.rows[0].count} rows`);
    }
    
  } catch (error: any) {
    if (error.message?.includes('password authentication failed')) {
      console.error('❌ Password authentication failed');
      console.log('\nMake sure you have the correct database password from:');
      console.log('https://supabase.com/dashboard/project/vghfcdtzywbmlacltnjp/settings/database');
    } else if (error.message?.includes('already exists')) {
      console.log('⚠️  Some objects already exist (this is OK)');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await client.end();
  }
}

main();
