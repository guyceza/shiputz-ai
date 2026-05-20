export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { creditGuard } from "@/lib/credit-guard";
import { addCredits } from "@/lib/credits";
import { createServiceClient } from "@/lib/supabase";

const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_VEO_MODEL = "veo-3.1-fast-generate-preview";
const REPLICATE_VEO_MODEL = "google/veo-3.1-fast";

// POST - start video generation, return prediction ID
export async function POST(req: NextRequest) {
  let chargedUserEmail: string | null = null;
  let chargedCost = 0;

  async function refundIfNeeded(reason: string) {
    if (!chargedUserEmail || chargedCost <= 0) return;
    try {
      await addCredits(chargedUserEmail, chargedCost, `refund_video-walkthrough_${reason}`);
      chargedUserEmail = null;
      chargedCost = 0;
    } catch (refundError) {
      console.error("Failed to refund video credits:", refundError);
    }
  }

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
    chargedUserEmail = userEmail;
    chargedCost = creditCheck.cost;

    // Replicate needs data URIs, Gemini needs raw base64.
    const firstBytes = await firstFrameFile.arrayBuffer();
    const firstB64 = Buffer.from(firstBytes).toString("base64");
    const firstDataUri = `data:image/jpeg;base64,${firstB64}`;

    const lastBytes = await lastFrameFile.arrayBuffer();
    const lastB64 = Buffer.from(lastBytes).toString("base64");
    const lastDataUri = `data:image/jpeg;base64,${lastB64}`;

    const noCutSuffix = " CRITICAL RULES: This is ONE SINGLE CONTINUOUS UNBROKEN CAMERA TAKE with ZERO cuts. The camera NEVER stops. The screen NEVER goes dark, black, or dim - not even for a single frame. There are NO fade-to-black transitions, NO dissolves, NO wipes, NO scene changes. The brightness stays consistent and high throughout the ENTIRE video. Every single frame shows a well-lit interior. The camera physically travels through space without any interruption whatsoever.";

    const defaultPrompt = "Smooth steadicam walkthrough of a home interior. The camera starts in the first room and physically glides forward at eye level, traveling through an open doorway or bright hallway corridor, continuously moving into the next room. The rooms are connected - the camera passes through the doorframe showing walls, ceiling and floor the entire time. Bright warm natural daylight fills both rooms. The hallway or transition area between rooms is well-lit and visible. Photorealistic interior design showcase. The camera movement is fluid, slow, and cinematic - never stopping, always revealing more of the space.";

    const finalPrompt = (prompt || defaultPrompt) + noCutSuffix;

    if (GEMINI_API_KEY) {
      const geminiRes = await fetch(`${GEMINI_BASE_URL}/models/${GEMINI_VEO_MODEL}:predictLongRunning`, {
        method: "POST",
        headers: {
          "x-goog-api-key": GEMINI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{
            prompt: finalPrompt,
            image: { bytesBase64Encoded: firstB64, mimeType: "image/jpeg" },
            lastFrame: { bytesBase64Encoded: lastB64, mimeType: "image/jpeg" },
          }],
          parameters: {
            resolution: "720p",
          },
        }),
      });

      if (geminiRes.ok) {
        const operation = await geminiRes.json();
        if (!operation.name) {
          await refundIfNeeded("gemini_no_operation");
          return NextResponse.json({ error: "ספק הווידאו לא החזיר מזהה פעולה" }, { status: 500 });
        }
        return NextResponse.json({ predictionId: `gemini:${operation.name}`, status: "starting" });
      }

      const err = await geminiRes.text();
      console.error("Gemini Veo start failed:", geminiRes.status, err);

      if (shouldFallbackToReplicate(geminiRes.status, err) && REPLICATE_TOKEN) {
        const replicateResult = await startReplicatePrediction(finalPrompt, firstDataUri, lastDataUri);
        if ("predictionId" in replicateResult) {
          return NextResponse.json({
            predictionId: replicateResult.predictionId,
            status: "starting",
            provider: "replicate",
            fallbackFrom: "gemini",
          });
        }

        await refundIfNeeded("replicate_fallback_start_failed");
        return NextResponse.json({
          error: friendlyVideoStartError(replicateResult.status, replicateResult.error),
        }, { status: responseStatus(replicateResult.status) });
      }

      await refundIfNeeded("gemini_start_failed");
      return NextResponse.json({
        error: friendlyVideoStartError(geminiRes.status, err),
      }, { status: responseStatus(geminiRes.status) });
    }

    if (!REPLICATE_TOKEN) {
      await refundIfNeeded("missing_video_provider");
      return NextResponse.json({ error: "ספק הווידאו לא מוגדר כרגע. הקרדיטים הוחזרו אוטומטית." }, { status: 500 });
    }

    const replicateResult = await startReplicatePrediction(finalPrompt, firstDataUri, lastDataUri);
    if (!("predictionId" in replicateResult)) {
      console.error("Replicate Veo start failed:", replicateResult.status, replicateResult.error);
      await refundIfNeeded("replicate_start_failed");
      return NextResponse.json({
        error: friendlyVideoStartError(replicateResult.status, replicateResult.error),
      }, { status: responseStatus(replicateResult.status) });
    }
    if (!replicateResult.predictionId) {
      await refundIfNeeded("replicate_no_prediction");
      return NextResponse.json({ error: "No prediction ID returned" }, { status: 500 });
    }

    return NextResponse.json({ predictionId: replicateResult.predictionId, status: "starting", provider: "replicate" });
  } catch (err: unknown) {
    await refundIfNeeded("server_error");
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

// GET - poll prediction status
export async function GET(req: NextRequest) {
  const predictionId = req.nextUrl.searchParams.get("id");
  if (!predictionId) return NextResponse.json({ error: "Missing prediction ID" }, { status: 400 });

  try {
    if (predictionId.startsWith("gemini:")) {
      const operationName = predictionId.slice("gemini:".length);
      const statusRes = await fetch(`${GEMINI_BASE_URL}/${operationName}`, {
        headers: { "x-goog-api-key": GEMINI_API_KEY },
      });
      const statusData = await statusRes.json();

      if (!statusRes.ok) {
        return NextResponse.json({
          status: "failed",
          error: friendlyVideoStartError(statusRes.status, JSON.stringify(statusData)),
        }, { status: statusRes.status >= 400 && statusRes.status < 500 ? statusRes.status : 500 });
      }

      if (!statusData.done) {
        return NextResponse.json({ status: "processing", progress: null });
      }

      if (statusData.error) {
        return NextResponse.json({
          status: "failed",
          error: statusData.error.message || "Video generation failed",
        }, { status: 500 });
      }

      const videoUri = statusData.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      if (!videoUri) return NextResponse.json({ error: "No video in response" }, { status: 500 });

      const videoRes = await fetch(videoUri, { headers: { "x-goog-api-key": GEMINI_API_KEY } });
      if (!videoRes.ok) return NextResponse.json({ error: "Failed to download video" }, { status: 500 });
      const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

      const supabase = createServiceClient();
      const operationId = operationName.split("/").pop()?.replace(/[^a-zA-Z0-9_-]/g, "") || Date.now().toString();
      const filename = `videos/gemini-${operationId}-${Date.now()}.mp4`;
      const { error: uploadError } = await supabase.storage
        .from("visualizations")
        .upload(filename, videoBuffer, { contentType: "video/mp4", upsert: true });

      if (uploadError) {
        return NextResponse.json({
          status: "succeeded",
          videoUrl: videoUri,
        });
      }

      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const storedUrl = `${SUPABASE_URL}/storage/v1/object/public/visualizations/${filename}`;

      return NextResponse.json({
        status: "succeeded",
        videoUrl: storedUrl,
      });
    }

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
  } catch (err: unknown) {
    return NextResponse.json({ error: errorMessage(err) }, { status: 500 });
  }
}

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : "Internal error";
}

function friendlyVideoStartError(status: number, rawError: string) {
  const lower = rawError.toLowerCase();
  if (status === 402 || lower.includes("insufficient credit") || lower.includes("billing")) {
    return "ספק הווידאו לא זמין כרגע בגלל חוסר קרדיט/בילינג. הקרדיטים הוחזרו אוטומטית.";
  }
  if (status === 429 || lower.includes("quota") || lower.includes("rate limit")) {
    return "ספק הווידאו עמוס או חרג מהמכסה כרגע. הקרדיטים הוחזרו אוטומטית, נסו שוב עוד מעט.";
  }
  if (status === 401 || status === 403 || lower.includes("permission") || lower.includes("api key")) {
    return "יש בעיית הרשאה מול ספק הווידאו. הקרדיטים הוחזרו אוטומטית.";
  }
  return "יצירת הסרטון לא התחילה אצל ספק הווידאו. הקרדיטים הוחזרו אוטומטית.";
}

async function startReplicatePrediction(finalPrompt: string, firstDataUri: string, lastDataUri: string) {
  const createRes = await fetch(`https://api.replicate.com/v1/models/${REPLICATE_VEO_MODEL}/predictions`, {
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
    return { status: createRes.status, error: await createRes.text() };
  }

  const prediction = await createRes.json();
  return { predictionId: prediction.id as string | undefined };
}

function shouldFallbackToReplicate(status: number, rawError: string) {
  const lower = rawError.toLowerCase();
  return (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status >= 500 ||
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("resource_exhausted") ||
    lower.includes("resource exhausted") ||
    lower.includes("unavailable") ||
    lower.includes("timeout") ||
    lower.includes("deadline")
  );
}

function responseStatus(status: number) {
  return status >= 400 && status < 500 ? status : 500;
}
