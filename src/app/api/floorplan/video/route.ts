import { NextRequest, NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { creditGuard } from "@/lib/credit-guard";

// Vertex AI Veo 3.1 Fast — video generation with first/last frame
// Uses OAuth via service account or user credentials

async function getAccessToken(): Promise<string> {
  const clientId = process.env.GWS_CLIENT_ID || "";
  const clientSecret = process.env.GWS_CLIENT_SECRET || "";
  const refreshToken = process.env.GWS_REFRESH_TOKEN || "";

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Failed to get access token: " + JSON.stringify(data));
  }
  return data.access_token;
}

const PROJECT_ID = process.env.GCP_PROJECT_ID || "93773361863";
const VEO_MODEL = "veo-3.1-fast-generate-preview";
const VEO_LOCATION = "us-central1";

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

    // Convert to base64
    const firstBytes = await firstFrameFile.arrayBuffer();
    const firstB64 = Buffer.from(firstBytes).toString("base64");
    const lastBytes = await lastFrameFile.arrayBuffer();
    const lastB64 = Buffer.from(lastBytes).toString("base64");

    const accessToken = await getAccessToken();

    const defaultPrompt = "ONE CONTINUOUS SINGLE TAKE with NO CUTS. Steadicam smoothly glides from the first room to the second room in one unbroken fluid motion. No transitions, no cuts, no scene changes. The camera physically moves through the connected space. Eye-level perspective, warm natural lighting. Photorealistic architectural walkthrough.";

    // Start Veo generation
    const veoRes = await fetch(
      `https://${VEO_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${VEO_LOCATION}/publishers/google/models/${VEO_MODEL}:predictLongRunning`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [{
            prompt: prompt || defaultPrompt,
            firstFrameImage: { bytesBase64Encoded: firstB64, mimeType: "image/jpeg" },
            lastFrameImage: { bytesBase64Encoded: lastB64, mimeType: "image/jpeg" },
          }],
          parameters: {
            aspectRatio: "16:9",
            sampleCount: 1,
            durationSeconds: 8,
          },
        }),
      }
    );

    if (!veoRes.ok) {
      const err = await veoRes.text();
      console.error("Veo start error:", err);
      return NextResponse.json({ error: "Video generation failed to start" }, { status: 500 });
    }

    const startData = await veoRes.json();
    const operationName = startData.name;

    if (!operationName) {
      return NextResponse.json({ error: "No operation returned" }, { status: 500 });
    }

    // Poll for completion (max ~5 minutes)
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 8000)); // 8 sec intervals

      const pollRes = await fetch(
        `https://${VEO_LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${VEO_LOCATION}/publishers/google/models/${VEO_MODEL}:fetchPredictOperation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ operationName }),
        }
      );

      const pollData = await pollRes.json();

      if (pollData.done) {
        const videos = pollData.response?.videos || [];
        if (videos.length > 0 && videos[0].bytesBase64Encoded) {
          return NextResponse.json({
            video: {
              data: videos[0].bytesBase64Encoded,
              mimeType: videos[0].mimeType || "video/mp4",
            },
          });
        }

        const filtered = pollData.response?.raiMediaFilteredCount || 0;
        if (filtered > 0) {
          return NextResponse.json({ error: "Video was filtered by safety settings. Try different room photos." }, { status: 400 });
        }

        return NextResponse.json({ error: "Video generation completed but no video returned" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Video generation timed out (5 min)" }, { status: 504 });
  } catch (error: any) {
    console.error("Video API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
