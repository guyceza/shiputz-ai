import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Our render server (Ubuntu with Blender via Cloudflare Tunnel)
const RENDER_SERVER_URL = process.env.RENDER_SERVER_URL || "https://render.wed4me.com";

export async function POST(request: NextRequest) {
  try {
    const { roomData } = await request.json();

    if (!roomData) {
      return NextResponse.json({ error: "No room data provided" }, { status: 400 });
    }

    // Proxy to our render server
    const response = await fetch(`${RENDER_SERVER_URL}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomData }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Render server error" }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Render proxy error:", error);
    return NextResponse.json(
      { error: "Failed to connect to render server" },
      { status: 503 }
    );
  }
}
