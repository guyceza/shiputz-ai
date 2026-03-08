export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { creditGuard } from "@/lib/credit-guard";
import { createServiceClient } from "@/lib/supabase";

// Replicate API — google/veo-3.1-fast
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || "";

// POST — start video generation, return prediction ID
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const firstFrameFile = formData.get("firstFrame") as File | null;
    const lastFrameFile = formData.get("lastFrame") as File | null;
    const prompt = formData.get("prompt") as string;
    const userEmail = formData.get("email") as string;

    if (!firstFrameFile || !lastFrameFile) {
      return NextResponse.json({ error: "Missing first or last frame" }, { status: 400 });
    }

    if (!userEmail) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    const creditCheck = await creditGuard(userEmail, 'video-walkthrough');
    if ('error' in creditCheck) return creditCheck.error;

    // Convert to base64 data URIs for Replicate
    const firstBytes = await firstFrameFile.arrayBuffer();
    const firstB64 = Buffer.from(firstBytes).toString("base64");
    const firstDataUri = `data:image/jpeg;base64,${firstB64}`;

    const lastBytes = await lastFrameFile.arrayBuffer();
    const lastB64 = Buffer.from(lastBytes).toString("base64");
    const lastDataUri = `data:image/jpeg;base64,${lastB64}`;

    const noCutSuffix = " CRITICAL RULES: This is ONE SINGLE CONTINUOUS UNBROKEN CAMERA TAKE with ZERO cuts. The camera NEVER stops. The screen NEVER goes dark, black, or dim — not even for a single frame. There are NO fade-to-black transitions, NO dissolves, NO wipes, NO scene changes. The brightness stays consistent and high throughout the ENTIRE video. Every single frame shows a well-lit interior. The camera physically travels through space without any interruption whatsoever.";

    const defaultPrompt = "Smooth steadicam walkthrough of a home interior. The camera starts in the first room and physically glides forward at eye level, traveling through an open doorway or bright hallway corridor, continuously moving into the next room. The rooms are connected — the camera passes through the doorframe showing walls, ceiling and floor the entire time. Bright warm natural daylight fills both rooms. The hallway or transition area between rooms is well-lit and visible. Photorealistic interior design showcase. The camera movement is fluid, slow, and cinematic — never stopping, always revealing more of the space.";

    const finalPrompt = (prompt || defaultPrompt) + noCutSuffix;

    // Create prediction on Replicate
    const createRes = await fetch("https://api.replicate.com/v1/models/google/veo-3.1-fast/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: finalPrompt,
          image: firstDataUri,
          last_frame: lastDataUri,
          duration: 8,
          aspect_ratio: "16:9",
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      return NextResponse.json({ error: "Video generation failed to start" }, { status: 500 });
    }

    const prediction = await createRes.json();

    if (!prediction.id) {
      return NextResponse.json({ error: "No prediction ID returned" }, { status: 500 });
    }

    // Return immediately with prediction ID — client will poll
    return NextResponse.json({ predictionId: prediction.id, status: "starting" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

// GET — poll prediction status
export async function GET(req: NextRequest) {
  const predictionId = req.nextUrl.searchParams.get("id");
  if (!predictionId) return NextResponse.json({ error: "Missing prediction ID" }, { status: 400 });

  try {
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
      headers: { "Authorization": `Bearer ${REPLICATE_TOKEN}` },
    });

    const pollData = await pollRes.json();

    if (pollData.status === "succeeded") {
      const videoUrl = pollData.output;
      if (!videoUrl) return NextResponse.json({ error: "No video in response" }, { status: 500 });

      // Download video from Replicate and upload to Supabase Storage
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) return NextResponse.json({ error: "Failed to download video" }, { status: 500 });
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

      const supabase = createServiceClient();
      const filename = `videos/${predictionId}-${Date.now()}.mp4`;
      const { error: uploadError } = await supabase.storage
        .from("visualizations")
        .upload(filename, videoBuffer, { contentType: "video/mp4", upsert: true });

      if (uploadError) {
        // Fallback: return Replicate URL directly instead of failing
        return NextResponse.json({
          status: "succeeded",
          videoUrl: videoUrl,
          metrics: pollData.metrics,
        });
      }

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const storedUrl = `${SUPABASE_URL}/storage/v1/object/public/visualizations/${filename}`;

      return NextResponse.json({
        status: "succeeded",
        videoUrl: storedUrl,
        metrics: pollData.metrics,
      });
    }

    if (pollData.status === "failed" || pollData.status === "canceled") {
      return NextResponse.json({ status: "failed", error: pollData.error || "Generation failed" }, { status: 500 });
    }

    // Still processing
    const logs = pollData.logs || "";
    const progressMatch = logs.match(/(\d+)%/g);
    const lastProgress = progressMatch ? parseInt(progressMatch[progressMatch.length - 1]) : null;

    return NextResponse.json({
      status: pollData.status,
      progress: lastProgress,
      started_at: pollData.started_at,
      created_at: pollData.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
