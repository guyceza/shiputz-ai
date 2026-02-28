#!/usr/bin/env node
/**
 * Run a SQL migration via Supabase REST API
 * Creates a temporary function, runs it, then deletes it
 */
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const idx = line.indexOf('=');
    if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  });
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function checkColumn() {
  // Try to select the column - if it exists, we get data; if not, we get an error
  const res = await fetch(`${SUPABASE_URL}/rest/v1/vision_history?select=id,detected_products&limit=1`, { headers });
  const text = await res.text();
  
  if (text.includes('42703') || text.includes('does not exist')) {
    console.log('❌ Column detected_products does NOT exist in vision_history');
    return false;
  } else {
    console.log('✅ Column detected_products exists in vision_history');
    console.log('Sample:', text.slice(0, 200));
    return true;
  }
}

async function main() {
  console.log('Checking vision_history table...\n');
  const exists = await checkColumn();
  
  if (!exists) {
    console.log('\n⚠️  Need to add column via Supabase Dashboard SQL Editor:');
    console.log('\nALTER TABLE vision_history ADD COLUMN IF NOT EXISTS detected_products JSONB DEFAULT NULL;');
    console.log('\nOr use the pooled database connection directly.');
  }
}

main().catch(console.error);
