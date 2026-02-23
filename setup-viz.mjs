import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('URL:', SUPABASE_URL);
console.log('Key exists:', !!SERVICE_KEY);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function setup() {
  // Check if table exists
  const { data, error } = await supabase
    .from('visualizations')
    .select('id')
    .limit(1);
  
  if (error && error.message.includes('does not exist')) {
    console.log('Table does not exist. Creating via dashboard is needed.');
    console.log(`
Run this SQL in Supabase Dashboard > SQL Editor:

CREATE TABLE visualizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT,
  analysis TEXT,
  costs JSONB,
  before_image_url TEXT,
  after_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visualizations_user_id ON visualizations(user_id);
    `);
  } else if (error) {
    console.log('Other error:', error.message);
  } else {
    console.log('Table exists! Data:', data);
  }
  
  // Check/create storage bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets?.map(b => b.name));
  
  if (!buckets?.find(b => b.name === 'visualizations')) {
    const { data: newBucket, error: bucketErr } = await supabase.storage.createBucket('visualizations', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    console.log('Created bucket:', newBucket, bucketErr?.message);
  } else {
    console.log('Bucket already exists');
  }
}

setup();
