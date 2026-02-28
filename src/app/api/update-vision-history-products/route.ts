export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId, products } = body;

    if (!id || !products) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Verify ownership before update
    const { data: item } = await supabase
      .from('vision_history')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!item || (userId && item.user_id !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from('vision_history')
      .update({ detected_products: products })
      .eq('id', id);

    if (error) {
      console.error('Update products error:', error);
      return NextResponse.json({ error: "Failed to save products" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update vision history products error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
