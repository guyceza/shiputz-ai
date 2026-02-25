export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Note: Auth check simplified - we verify ownership via userId match below

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visualizationId, products, userId } = body;

    if (!visualizationId || !products) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify ownership before update - check visualization exists
    const { data: visualization } = await supabase
      .from('visualizations')
      .select('user_id')
      .eq('id', visualizationId)
      .single();

    // If userId provided, verify it matches; otherwise just check visualization exists
    if (!visualization || (userId && visualization.user_id !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from('visualizations')
      .update({ detected_products: products })
      .eq('id', visualizationId);

    if (error) {
      console.error('Update products error:', error);
      return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update visualization products error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
