const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  const testEmail = 'test-ollie@shipazti.com';
  const testPassword = 'Test123456!';
  const testName = 'Test Ollie';
  
  console.log('Creating test user:', testEmail);
  
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { name: testName }
  });
  
  if (authError) {
    if (authError.message.includes('already been registered')) {
      console.log('User already exists, updating permissions...');
      
      // Get existing user
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find(u => u.email === testEmail);
      
      if (existingUser) {
        // Update user in profiles table
        const { error: updateError } = await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            email: testEmail,
            name: testName,
            purchased: true,
            vision_subscription: true,
            created_at: new Date().toISOString()
          });
        
        if (updateError) {
          console.error('Failed to update profile:', updateError);
        } else {
          console.log('✅ User permissions updated!');
        }
        
        console.log('\n📧 Test Account:');
        console.log('Email:', testEmail);
        console.log('Password:', testPassword);
        console.log('User ID:', existingUser.id);
        return;
      }
    }
    console.error('Auth error:', authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log('User created with ID:', userId);
  
  // 2. Create profile with full permissions
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: testEmail,
      name: testName,
      purchased: true,
      vision_subscription: true,
      created_at: new Date().toISOString()
    });
  
  if (profileError) {
    console.error('Profile error:', profileError);
  } else {
    console.log('✅ Profile created with full permissions');
  }
  
  console.log('\n📧 Test Account Created:');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('User ID:', userId);
  console.log('\nPermissions:');
  console.log('- purchased: true (main subscription)');
  console.log('- vision_subscription: true (Vision features)');
}

createTestUser().catch(console.error);
