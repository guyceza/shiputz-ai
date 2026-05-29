export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { verifyUserEmail } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  if (!(await verifyUserEmail(userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("floorplan_videos")
    .select("id, video_url, from_room_he, to_room_he, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ videos: data || [] });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoUrl, fromRoomHe, toRoomHe, prompt } = body;

    if (!userId || !videoUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!(await verifyUserEmail(userId))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("floorplan_videos")
      .insert({
        user_id: userId,
        video_url: videoUrl,
        from_room_he: fromRoomHe || null,
        to_room_he: toRoomHe || null,
        prompt: prompt || null,
      })
      .select("id, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, video: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
