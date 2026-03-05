import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { isAdminEmail } from "@/lib/admin";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const clickX = parseFloat(formData.get("clickX") as string); // 0-100 percentage
    const clickY = parseFloat(formData.get("clickY") as string); // 0-100 percentage
    const userEmail = formData.get("email") as string;

    if (!image || isNaN(clickX) || isNaN(clickY)) {
      return NextResponse.json({ error: "Missing image or click position" }, { status: 400 });
    }

    if (!userEmail || !isAdminEmail(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    const prompt = `This is a top-down floor plan rendering of an apartment. The user clicked at position ${clickX.toFixed(1)}% from the left and ${clickY.toFixed(1)}% from the top of the image.

Identify which room or area the user clicked on. Respond in JSON format only:
{
  "room": "the room name in English (e.g. living room, kitchen, bedroom, bathroom, hallway, balcony, dining area, home office)",
  "roomHe": "the room name in Hebrew",
  "description": "brief description of what you see in that area of the floor plan"
}

If the click is on a wall, door, or unclear area, pick the nearest room. Respond with ONLY the JSON, no other text.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/models/${AI_MODELS.IMAGE_GEN}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            responseModalities: ["TEXT"],
            temperature: 0.2,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini detect-room error:", err);
      return NextResponse.json({ error: "Room detection failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not identify room", raw: text }, { status: 500 });
    }

    const roomInfo = JSON.parse(jsonMatch[0]);
    return NextResponse.json(roomInfo);
  } catch (error: any) {
    console.error("Detect room error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
