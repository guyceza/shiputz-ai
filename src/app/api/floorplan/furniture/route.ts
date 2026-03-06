import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { isAdminEmail } from "@/lib/admin";
import { creditGuard } from "@/lib/credit-guard";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const roomImage = formData.get("roomImage") as File | null;
    const furnitureImage = formData.get("furnitureImage") as File | null;
    const instruction = formData.get("instruction") as string;
    const userEmail = formData.get("email") as string;

    if (!roomImage || !furnitureImage || !instruction) {
      return NextResponse.json({ error: "Missing room image, furniture image, or instruction" }, { status: 400 });
    }

    if (!userEmail) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    const creditCheck = await creditGuard(userEmail, 'furniture-swap');
    if ('error' in creditCheck) return creditCheck.error;

    const roomBytes = await roomImage.arrayBuffer();
    const roomBase64 = Buffer.from(roomBytes).toString("base64");
    const roomMime = roomImage.type || "image/jpeg";

    const furnBytes = await furnitureImage.arrayBuffer();
    const furnBase64 = Buffer.from(furnBytes).toString("base64");
    const furnMime = furnitureImage.type || "image/jpeg";

    const prompt = `I have two images:
1. First image: A photorealistic interior room render
2. Second image: A piece of furniture I want to place in the room

Instruction: ${instruction}

Replace or add the furniture from the second image into the room shown in the first image. Keep the room's lighting, style, perspective, and all other elements exactly the same. Only change the specific furniture piece mentioned. The result should look completely natural and photorealistic, as if the new furniture was always part of the room. Match the lighting and shadows precisely.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: roomMime, data: roomBase64 } },
              { inlineData: { mimeType: furnMime, data: furnBase64 } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            temperature: 0.4,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini furniture error:", err);
      return NextResponse.json({ error: "Furniture swap failed" }, { status: 500 });
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    let resultImage = null;
    let resultText = "";

    for (const part of parts) {
      if (part.inlineData) {
        resultImage = { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
      if (part.text) resultText += part.text;
    }

    if (!resultImage) {
      return NextResponse.json({ error: "No image generated", text: resultText }, { status: 500 });
    }

    return NextResponse.json({ image: resultImage, text: resultText });
  } catch (error: any) {
    console.error("Furniture API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
