import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUsageStats, checkRateLimitWarning } from '@/lib/usage-monitor';

import { ADMIN_EMAILS } from '@/lib/admin';

// Verify admin
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

// GET - Get system stats and alerts
export async function GET(request: NextRequest) {
  const adminEmail = request.nextUrl.searchParams.get('adminEmail');
  
  const isAdmin = await verifyAdmin(adminEmail);
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const supabase = createServiceClient();
  
  try {
    // Get usage stats
    const usageStats = getUsageStats();
    const rateLimitWarning = checkRateLimitWarning();
    
    // Get database stats
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: premiumUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('purchased', true);
    
    const { count: visionUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('vision_subscription', 'active');
    
    // Get users approaching monthly limit (8+ uses this month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: highUsageUsers } = await supabase
      .from('users')
      .select('email, vision_usage_count')
      .eq('vision_usage_month', currentMonth)
      .gte('vision_usage_count', 8);
    
    // Combine all alerts
    const alerts = [...usageStats.alerts];
    if (rateLimitWarning.warning) {
      alerts.push(rateLimitWarning.message!);
    }
    if (highUsageUsers && highUsageUsers.length > 0) {
      alerts.push(`📊 ${highUsageUsers.length} משתמשים מתקרבים למכסה החודשית`);
    }
    
    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers || 0,
          premium: premiumUsers || 0,
          vision: visionUsers || 0,
        },
        usage: {
          requestsThisHour: usageStats.requests,
          errorsThisHour: usageStats.errors,
          errorRate: usageStats.requests > 0 
            ? ((usageStats.errors / usageStats.requests) * 100).toFixed(1) + '%'
            : '0%',
          byEndpoint: usageStats.byEndpoint,
        },
        highUsageUsers: highUsageUsers || [],
      },
      alerts,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
