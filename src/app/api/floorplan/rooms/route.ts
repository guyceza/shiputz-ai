export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// GET — load rooms for a user (optionally filtered by session)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  const supabase = createServiceClient();
  let query = supabase
    .from("floorplan_rooms")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (sessionId) query = query.eq("session_id", sessionId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ rooms: data || [] });
}

// POST — save a room photo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, roomName, roomNameHe, imageData, style } = body;

    if (!userId || !sessionId || !roomName || !imageData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!SUPABASE_URL) {
      return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
    }

    const supabase = createServiceClient();

    // Upload image to storage
    const blob = await dataUrlToBlob(imageData);
    const filename = `rooms/${userId}/${sessionId}/${Date.now()}-${roomName}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("visualizations")
      .upload(filename, blob, { contentType: "image/jpeg", upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/visualizations/${filename}`;

    // Check if room already exists for this session
    const { data: existing } = await supabase
      .from("floorplan_rooms")
      .select("id")
      .eq("user_id", userId)
      .eq("session_id", sessionId)
      .eq("room_name", roomName)
      .single();

    if (existing) {
      // Update existing
      await supabase
        .from("floorplan_rooms")
        .update({ image_url: imageUrl, room_name_he: roomNameHe || roomName, style })
        .eq("id", existing.id);
    } else {
      // Insert new
      await supabase.from("floorplan_rooms").insert({
        user_id: userId,
        session_id: sessionId,
        room_name: roomName,
        room_name_he: roomNameHe || roomName,
        image_url: imageUrl,
        style: style || null,
      });
    }

    return NextResponse.json({ success: true, imageUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Buffer> {
  const base64 = dataUrl.replace(/^data:.*?;base64,/, "");
  return Buffer.from(base64, "base64");
}
