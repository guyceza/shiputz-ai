export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { visualizationId, products } = body;

    if (!visualizationId || !products) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Bug #H02 fix: Verify user is authenticated
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Verify ownership before update
    const { data: visualization } = await supabase
      .from('visualizations')
      .select('user_id')
      .eq('id', visualizationId)
      .single();

    if (!visualization || visualization.user_id !== authUser.id) {
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
