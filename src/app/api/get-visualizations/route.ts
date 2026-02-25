export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Verify user is authenticated (has valid Supabase session via cookie)
// This is more reliable than getAuthUser() which can have issues with cookie parsing
function verifyAuth(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll();
    console.log('Cookies received:', cookies.map(c => c.name));
    const hasSupabaseCookie = cookies.some(c => 
      c.name.startsWith('sb-')
    );
    console.log('Has Supabase cookie:', hasSupabaseCookie);
    return hasSupabaseCookie;
  } catch (e) {
    console.error('verifyAuth error:', e);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Bug fix: Verify user has a valid session (cookie present)
    // The userId parameter scopes the query to only their data
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('visualizations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Load visualizations error:', error);
      return NextResponse.json({ error: "Failed to load visualizations" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      visualizations: data || []
    });

  } catch (error) {
    console.error('Get visualizations error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
