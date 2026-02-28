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

    // Get the most recent Shop the Look entry for this user
    const { data, error } = await supabase
      .from('vision_history')
      .select('id, before_image_url, detected_products, created_at')
      .eq('user_id', userId)
      .like('description', '%Shop the Look%')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Get shop look history error:', error);
      return NextResponse.json({ error: "Failed to get history" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        success: true, 
        hasHistory: false 
      });
    }

    return NextResponse.json({
      success: true,
      hasHistory: true,
      visionId: data.id,
      imageUrl: data.before_image_url,
      products: data.detected_products || [],
      createdAt: data.created_at
    });

  } catch (error) {
    console.error('Get shop look history error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
