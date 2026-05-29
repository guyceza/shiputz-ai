import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { isAdminEmail } from "@/lib/admin";
import { creditGuard } from "@/lib/credit-guard";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const clickX = parseFloat(formData.get("clickX") as string); // 0-100 percentage
    const clickY = parseFloat(formData.get("clickY") as string); // 0-100 percentage
    const userEmail = formData.get("email") as string;
    const isDemoRoom = formData.get("demoRoom") === "true";

    if (!image || isNaN(clickX) || isNaN(clickY)) {
      return NextResponse.json({ error: "Missing image or click position" }, { status: 400 });
    }

    // Auth only - detect-room is free (credit charged on room photo generation).
    // Demo rooms are allowed without auth so ad visitors can see one real result before signup.
    if (!userEmail && !isDemoRoom) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    if (isDemoRoom && !userEmail) {
      const rateLimit = checkRateLimit(`floorplan-demo-room-detect:${getClientId(req)}`, 4, 24 * 60 * 60 * 1000);
      if (!rateLimit.success) {
        return NextResponse.json({ error: "יותר מדי ניסיונות דוגמה כרגע. נסו שוב מאוחר יותר." }, { status: 429 });
      }
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    const prompt = `This is a top-down floor plan rendering of an apartment. The user clicked at position ${clickX.toFixed(1)}% from the left and ${clickY.toFixed(1)}% from the top of the image.

Identify which room or area the user clicked on. Also estimate the room's dimensions in meters based on the floor plan scale. Respond in JSON format only:
{
  "room": "the room name in English (e.g. living room, kitchen, bedroom, bathroom, hallway, balcony, dining area, home office)",
  "roomHe": "the room name in Hebrew",
  "description": "תיאור קצר בעברית בלבד של מה שרואים באזור שנבחר בתוכנית, למשל: פינת אוכל עם שולחן מלבני וארבעה כיסאות",
  "dimensions": { "width": 3.5, "height": 4.0 }
}

For dimensions, estimate in meters based on typical Israeli apartment proportions. If you can see dimension labels on the plan, use those. Otherwise estimate based on room type and relative size.
If the click is on a wall, door, or unclear area, pick the nearest room.
Important: "roomHe" and "description" must be in Hebrew only. Do not return English text in "description".
Respond with ONLY the JSON, no other text.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${GEMINI_KEY}`,
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
      return NextResponse.json({ error: "Room detection failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response (greedy match for nested objects like dimensions)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not identify room", raw: text }, { status: 500 });
    }

    // Clean markdown code fences if present
    let jsonStr = jsonMatch[0].replace(/```json\s*|\s*```/g, '').trim();
    const roomInfo = JSON.parse(jsonStr);
    return NextResponse.json(roomInfo);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
