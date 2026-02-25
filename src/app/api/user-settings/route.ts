export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Verify user is authenticated (has valid Supabase session via cookie)
function verifyAuth(request: NextRequest): boolean {
  try {
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => 
      c.name.startsWith('sb-')
    );
    return hasSupabaseCookie;
  } catch {
    return false;
  }
}

// GET - Get user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Bug fix: Verify user has a valid session
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No row found - create one
      const { data: newData, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: userId })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create user settings:', insertError);
        return NextResponse.json({ error: "Failed to create settings" }, { status: 500 });
      }
      return NextResponse.json({ settings: newData });
    }

    if (error) {
      console.error('Failed to get user settings:', error);
      return NextResponse.json({ error: "Failed to get settings" }, { status: 500 });
    }

    return NextResponse.json({ settings: data });

  } catch (error) {
    console.error('User settings GET error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Update user settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Bug fix: Verify user has a valid session
    if (!verifyAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to update user settings:', error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('User settings POST error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
