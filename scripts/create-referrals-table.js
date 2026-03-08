#!/usr/bin/env node
/**
 * Create referrals table in Supabase
 * Run once: node scripts/create-referrals-table.js
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

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  // Create table via REST insert approach — we'll create via the app's API
  // Instead, let's use the Supabase Management API
  
  const projectRef = 'vghfcdtzywbmlacltnjp';
  
  // Get Supabase access token from config
  let sbToken;
  try {
    const creds = JSON.parse(fs.readFileSync('/home/ubuntu/clawd/config/supabase-credentials.json', 'utf8'));
    sbToken = creds.access_token || creds.token;
  } catch(e) {
    // Try with service role key via SQL function
  }
  
  const sql = `
    -- Referrals table
    CREATE TABLE IF NOT EXISTS referrals (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      referrer_email text NOT NULL,
      referral_code text NOT NULL UNIQUE,
      referred_email text,
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
      referrer_credited boolean DEFAULT false,
      referred_credited boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      completed_at timestamptz,
      CONSTRAINT fk_referrer FOREIGN KEY (referrer_email) REFERENCES users(email) ON DELETE CASCADE
    );

    -- Index for fast lookups
    CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
    CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_email);
    CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_email);

    -- Add referral_code column to users table if not exists
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by text;
    EXCEPTION WHEN others THEN NULL;
    END $$;
  `;

  // Try Supabase Management API
  if (sbToken) {
    const resp = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sbToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    const result = await resp.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } else {
    console.log('No Supabase management token found.');
    console.log('Please run this SQL in the Supabase Dashboard SQL Editor:');
    console.log('---');
    console.log(sql);
    console.log('---');
  }
}

main().catch(console.error);
