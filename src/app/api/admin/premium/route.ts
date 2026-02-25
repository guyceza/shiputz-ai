import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const RESEND_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAILS = ['guyceza@gmail.com'];

// Verify admin exists in database (not just string match)
async function verifyAdmin(email: string | null): Promise<boolean> {
  if (!email || !ADMIN_EMAILS.includes(email.toLowerCase())) {
    return false;
  }
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('email', email.toLowerCase())
    .single();
  return !!data;
}

// Send welcome premium email
async function sendWelcomePremiumEmail(email: string, name?: string) {
  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #111; margin: 0;">🎉 ברוך הבא ל-ShiputzAI Premium!</h1>
      </div>
      
      <p style="font-size: 16px; color: #333;">היי ${name || 'משפץ יקר'},</p>
      
      <p style="font-size: 16px; color: #333;">
        תודה רבה! אנחנו שמחים שבחרת ב-ShiputzAI לניהול השיפוץ שלך.
      </p>
      
      <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #111; margin-top: 0;">✅ מה מחכה לך:</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li>מעקב תקציב חכם בזמן אמת</li>
          <li>סריקת קבלות אוטומטית עם AI</li>
          <li>ניתוח הצעות מחיר</li>
          <li>עוזר AI אישי לכל שאלה</li>
          <li>התראות חכמות לפני חריגות</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://shipazti.com/dashboard" 
           style="display: inline-block; background: #111; color: white; padding: 14px 32px; border-radius: 30px; text-decoration: none; font-weight: bold;">
          כניסה לדשבורד ←
        </a>
      </div>
      
      <p style="font-size: 16px; color: #333;">
        בהצלחה עם השיפוץ! 🏠<br>
        <strong>צוות ShiputzAI</strong>
      </p>
      <p style="margin-top: 30px; text-align: center;"><a href="https://shipazti.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #999; font-size: 12px;">להסרה מרשימת התפוצה</a></p>
    </div>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShiputzAI <help@shipazti.com>',
        to: email,
        subject: '🎉 ברוך הבא ל-ShiputzAI Premium!',
        html,
      }),
    });
    return response.json();
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return null;
  }
}

// GET - Get premium users list or check if email has premium
export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email');
  const adminEmail = request.nextUrl.searchParams.get('adminEmail');
  const supabase = createServiceClient();
  
  if (!email) {
    // Bug fix: Require admin auth to get full premium list
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get all premium users
    const { data } = await supabase
      .from('users')
      .select('email, name, purchased, purchased_at')
      .eq('purchased', true);
    
    // Transform to expected format for admin panel
    const list = (data || []).map(u => ({
      email: u.email,
      days: u.purchased_at ? Math.floor((Date.now() - new Date(u.purchased_at).getTime()) / (1000*60*60*24)) : 0,
      until: 'lifetime', // Premium is permanent
      addedAt: u.purchased_at
    }));
    
    return NextResponse.json({ list });
  }
  
  // Check specific user
  const { data } = await supabase
    .from('users')
    .select('purchased, purchased_at, vision_subscription, vision_trial_used')
    .eq('email', email.toLowerCase())
    .single();
    
  return NextResponse.json({ 
    hasPremium: data?.purchased || false, 
    hasVision: data?.vision_subscription === 'active' || data?.vision_subscription === true,
    trialUsed: data?.vision_trial_used || false,
    since: data?.purchased_at 
  });
}

// POST - Add premium to user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const supabase = createServiceClient();
    
    // Get user info
    const { data: user } = await supabase
      .from('users')
      .select('name, purchased')
      .eq('email', email.toLowerCase())
      .single();
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Check if already premium
    if (user.purchased) {
      return NextResponse.json({ message: 'User already has premium' });
    }
    
    // Update user to premium
    const { error } = await supabase
      .from('users')
      .update({
        purchased: true,
        purchased_at: new Date().toISOString(),
      })
      .eq('email', email.toLowerCase());
    
    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
    
    // Send welcome premium email
    await sendWelcomePremiumEmail(email, user.name);
    
    // Mark day 0 of purchased sequence as sent (to avoid duplicate welcome email from cron)
    try {
      await supabase.from('email_sequences').insert({
        user_email: email.toLowerCase(),
        sequence_type: 'purchased',
        day_number: 0,
      });
    } catch (e) {
      // Ignore if already exists
    }
    
    // Get updated list for admin panel
    const { data: allPremium } = await supabase
      .from('users')
      .select('email, name, purchased_at')
      .eq('purchased', true);
    
    const list = (allPremium || []).map(u => ({
      email: u.email,
      days: u.purchased_at ? Math.floor((Date.now() - new Date(u.purchased_at).getTime()) / (1000*60*60*24)) : 0,
      until: 'lifetime',
      addedAt: u.purchased_at
    }));
    
    return NextResponse.json({ success: true, list });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to add premium' }, { status: 500 });
  }
}

// DELETE - Remove premium from user
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, adminEmail } = body;
    
    const isAdmin = await verifyAdmin(adminEmail);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from('users')
      .update({
        purchased: false,
        purchased_at: null,
      })
      .eq('email', email.toLowerCase());
    
    if (error) {
      return NextResponse.json({ error: 'Failed to remove premium' }, { status: 500 });
    }
    
    // Get updated list for admin panel
    const { data: allPremium } = await supabase
      .from('users')
      .select('email, name, purchased_at')
      .eq('purchased', true);
    
    const list = (allPremium || []).map(u => ({
      email: u.email,
      days: u.purchased_at ? Math.floor((Date.now() - new Date(u.purchased_at).getTime()) / (1000*60*60*24)) : 0,
      until: 'lifetime',
      addedAt: u.purchased_at
    }));
    
    return NextResponse.json({ success: true, list });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove premium' }, { status: 500 });
  }
}
