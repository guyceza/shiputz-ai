import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { creditGuard } from "@/lib/credit-guard";
import { addCredits } from "@/lib/credits";

export async function POST(request: NextRequest) {
  let chargedUserEmail: string | null = null;
  let chargedCost = 0;

  async function refundIfNeeded(reason: string) {
    if (!chargedUserEmail || chargedCost <= 0) return;
    try {
      await addCredits(chargedUserEmail, chargedCost, `refund_style-match_${reason}`);
      chargedUserEmail = null;
      chargedCost = 0;
    } catch (refundError) {
      console.error("Failed to refund style matcher credits:", refundError);
    }
  }

  try {
    const { image, userEmail } = await request.json();
    if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

    // Credit check
    const guard = await creditGuard(userEmail, 'style-match');
    if ('error' in guard) return guard.error;
    chargedUserEmail = userEmail;
    chargedCost = guard.cost;

    const imageMatch = image.match(/^data:([^;]+);base64,(.+)$/);
    const mimeType = imageMatch?.[1] || "image/jpeg";
    const base64 = imageMatch?.[2] || image.replace(/^data:image\/\w+;base64,/, "");
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.VISION_FAST}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: `Analyze this interior image and return ONLY valid JSON with this exact structure:
{
  "style": "Hebrew style name",
  "styleEnglish": "English style name",
  "confidence": 85,
  "characteristics": ["Hebrew characteristic"],
  "materials": [{"name":"Hebrew material", "usage":"Hebrew usage", "textureType":"wood"}],
  "lighting": {"type":"Hebrew type", "description":"Hebrew description"},
  "shoppingList": [{"item":"Hebrew item", "description":"Hebrew description", "material":"Hebrew material", "priceRange":"ILS range", "searchQuery":"Hebrew shopping query", "position":{"top":60,"left":45}}],
  "tips": ["Hebrew tip"]
}
Rules: textureType must be one of wood, metal, glass, fabric, linen, stone, marble, ceramic, concrete, leather, wool, rattan, bamboo, brick, tile, velvet, cotton, plastic, paper, cork. Return 5 materials, 6 shoppingList items, 3 tips. No markdown.` }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      await refundIfNeeded('ai_error');
      return NextResponse.json({ error: "Style analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts
      .map((part: { text?: string }) => part.text || "")
      .join("\n")
      .trim();
    
    if (!text) {
      await refundIfNeeded('empty_response');
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }
    
    let result;
    try {
      const cleanText = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch?.[0] || cleanText);
      if (typeof result === "string") {
        result = JSON.parse(result);
      }
    } catch {
      await refundIfNeeded('parse_error');
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    await refundIfNeeded('server_error');
    return NextResponse.json({ error: error instanceof Error ? error.message : "Style analysis failed" }, { status: 500 });
  }
}
