const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function addSubscription() {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('❌ No service key found');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const testEmail = 'test-ollie@shipazti.com';
  
  console.log('🔍 Finding user:', testEmail);
  
  // First check if user exists
  const { data: existing, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('email', testEmail)
    .single();
  
  if (findError) {
    console.log('User not found, error:', findError.message);
    return;
  }
  
  console.log('Current user data:', existing);
  
  // Update user to have both subscriptions
  const { data, error } = await supabase
    .from('users')
    .update({
      purchased: true,
      vision_subscription: true,
      vision_trial_used: false,
      vision_usage_count: 0,
      vision_usage_month: new Date().toISOString().slice(0, 7)
    })
    .eq('email', testEmail)
    .select();
  
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Updated user:', data);
  }
}

addSubscription();
