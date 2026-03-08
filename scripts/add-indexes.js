const { Client } = require('pg');

const client = new Client({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.vghfcdtzywbmlacltnjp',
  password: 'H3jvNMUKFtVdDxSJ',
  ssl: { rejectUnauthorized: false }
});

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_email_sequences_user_type ON email_sequences (user_email, sequence_type)',
  'CREATE INDEX IF NOT EXISTS idx_email_sequences_sent_at ON email_sequences (sent_at)',
  'CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created ON credit_transactions (user_id, created_at)',
  'CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals (referral_code)',
  'CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals (referred_email)',
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)',
  'CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users (referral_code)',
];

async function main() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL');
  
  for (const sql of indexes) {
    try {
      await client.query(sql);
      console.log('✅', sql.split('IF NOT EXISTS ')[1]);
    } catch (err) {
      console.error('❌', sql.split('IF NOT EXISTS ')[1], '-', err.message);
    }
  }
  
  await client.end();
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
