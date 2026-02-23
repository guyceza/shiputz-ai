export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
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
