import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// Lazy initialization to avoid build-time errors
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

// Generate a share link for a project
export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { projectId, userId, expiresInDays = 7 } = await req.json();

    if (!projectId || !userId) {
      return NextResponse.json({ error: "Missing projectId or userId" }, { status: 400 });
    }

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id, name")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate share token
    const shareToken = nanoid(16);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Store share token
    const { error: insertError } = await supabase
      .from("project_shares")
      .upsert({
        project_id: projectId,
        share_token: shareToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'project_id'
      });

    if (insertError) {
      console.error("Failed to create share:", insertError);
      return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
    }

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://shipazti.com'}/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Share API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Get share info
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const { data: share, error } = await supabase
      .from("project_shares")
      .select(`
        project_id,
        expires_at,
        projects (
          id,
          name,
          data
        )
      `)
      .eq("share_token", token)
      .single();

    if (error || !share) {
      return NextResponse.json({ error: "Invalid or expired share link" }, { status: 404 });
    }

    // Check expiration
    if (new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      project: share.projects,
    });
  } catch (error) {
    console.error("Share GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
