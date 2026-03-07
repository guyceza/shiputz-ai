import { NextRequest, NextResponse } from "next/server";
import { creditGuard } from "@/lib/credit-guard";

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

    const noCutSuffix = " ABSOLUTELY ONE CONTINUOUS UNBROKEN SINGLE TAKE. NO cuts, NO fades, NO fade-to-black, NO dissolves, NO transitions of any kind. The screen must NEVER go dark or dim at any point. The camera never stops moving forward. Constant visible environment throughout. The entire video is one single continuous camera movement with zero interruptions.";

    const defaultPrompt = "A steadicam smoothly and physically glides from the first room through a doorway or hallway into the second room in one seamless uninterrupted fluid motion. Eye-level perspective, warm natural lighting, photorealistic interior architectural walkthrough.";

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
      console.error("Replicate create error:", err);
      return NextResponse.json({ error: "Video generation failed to start" }, { status: 500 });
    }

    const prediction = await createRes.json();

    if (!prediction.id) {
      return NextResponse.json({ error: "No prediction ID returned" }, { status: 500 });
    }

    // Return immediately with prediction ID — client will poll
    return NextResponse.json({ predictionId: prediction.id, status: "starting" });
  } catch (err: any) {
    console.error("Video route error:", err);
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

      return NextResponse.json({
        status: "succeeded",
        videoUrl,
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
