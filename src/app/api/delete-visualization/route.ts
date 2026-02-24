export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Bug #6 fix: Check if visualization exists and user owns it
    const { data: viz, error: fetchError } = await supabase
      .from('visualizations')
      .select('id, user_id, before_image_url, after_image_url')
      .eq('id', id)
      .single();

    // Check if visualization exists
    if (fetchError || !viz) {
      return NextResponse.json({ error: "Visualization not found" }, { status: 404 });
    }

    // Verify ownership
    if (viz.user_id !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Delete from database
    const { error, count } = await supabase
      .from('visualizations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete visualization error:', error);
      return NextResponse.json({ error: "Failed to delete visualization" }, { status: 500 });
    }

    // Try to delete images from storage (best effort)
    if (viz) {
      const extractPath = (url: string) => url.split('/visualizations/')[1];
      try {
        if (viz.before_image_url) {
          await supabase.storage.from('visualizations').remove([extractPath(viz.before_image_url)]);
        }
        if (viz.after_image_url) {
          await supabase.storage.from('visualizations').remove([extractPath(viz.after_image_url)]);
        }
      } catch (e) {
        console.error('Failed to delete images from storage:', e);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete visualization error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
