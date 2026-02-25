#!/usr/bin/env node
/**
 * Supabase Admin CLI for ShiputzAI
 * Usage:
 *   node supabase-admin.js users          - List all users
 *   node supabase-admin.js user <email>   - Get user by email
 *   node supabase-admin.js role <email> <role>  - Set user role (admin/user)
 *   node supabase-admin.js delete <email> - Delete user
 * 
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require('fs');
const path = require('path');

// Bug #C02 fix: Load credentials from .env.local instead of hardcoding
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = {};
  
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const idx = line.indexOf('=');
      if (idx > 0) {
        env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    });
  } catch (e) {
    console.error('Error: Could not read .env.local file');
    console.error('Make sure you are running this from the project root');
    process.exit(1);
  }
  
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Error: Missing required environment variables:');
  if (!SUPABASE_URL) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  if (!SERVICE_ROLE_KEY) console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
  'Content-Type': 'application/json'
};

async function listUsers() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
  const data = await res.json();
  
  if (data.users) {
    console.log(`\n📊 Total Users: ${data.users.length}\n`);
    console.log('Email                          | Role    | Confirmed | Last Sign In');
    console.log('-'.repeat(80));
    
    for (const user of data.users) {
      const email = (user.email || 'N/A').padEnd(30);
      const role = (user.user_metadata?.role || 'user').padEnd(7);
      const confirmed = user.email_confirmed_at ? '✅' : '❌';
      const lastSignIn = user.last_sign_in_at 
        ? new Date(user.last_sign_in_at).toLocaleString('he-IL') 
        : 'Never';
      console.log(`${email} | ${role} | ${confirmed}        | ${lastSignIn}`);
    }
    console.log();
  } else {
    console.log('Error:', data);
  }
}

async function getUser(email) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
  const data = await res.json();
  
  const user = data.users?.find(u => u.email === email);
  if (user) {
    console.log('\n👤 User Details:');
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log(`User ${email} not found`);
  }
}

async function setRole(email, role) {
  // First find the user
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
  const data = await res.json();
  
  const user = data.users?.find(u => u.email === email);
  if (!user) {
    console.log(`User ${email} not found`);
    return;
  }
  
  // Update user metadata
  const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      user_metadata: { ...user.user_metadata, role }
    })
  });
  
  if (updateRes.ok) {
    console.log(`✅ Updated ${email} role to: ${role}`);
  } else {
    const err = await updateRes.json();
    console.log('Error:', err);
  }
}

async function deleteUser(email) {
  // First find the user
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { headers });
  const data = await res.json();
  
  const user = data.users?.find(u => u.email === email);
  if (!user) {
    console.log(`User ${email} not found`);
    return;
  }
  
  const deleteRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${user.id}`, {
    method: 'DELETE',
    headers
  });
  
  if (deleteRes.ok) {
    console.log(`🗑️ Deleted user: ${email}`);
  } else {
    const err = await deleteRes.json();
    console.log('Error:', err);
  }
}

// CLI
const [,, command, arg1, arg2] = process.argv;

switch (command) {
  case 'users':
    listUsers();
    break;
  case 'user':
    if (!arg1) {
      console.log('Usage: node supabase-admin.js user <email>');
    } else {
      getUser(arg1);
    }
    break;
  case 'role':
    if (!arg1 || !arg2) {
      console.log('Usage: node supabase-admin.js role <email> <role>');
    } else {
      setRole(arg1, arg2);
    }
    break;
  case 'delete':
    if (!arg1) {
      console.log('Usage: node supabase-admin.js delete <email>');
    } else {
      deleteUser(arg1);
    }
    break;
  default:
    console.log(`
Supabase Admin CLI for ShiputzAI

Commands:
  users              - List all users
  user <email>       - Get user details by email
  role <email> <role> - Set user role (admin/user)
  delete <email>     - Delete user
    `);
}
