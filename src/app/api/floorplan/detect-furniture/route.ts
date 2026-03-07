import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { isAdminEmail } from "@/lib/admin";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const clickX = parseFloat(formData.get("clickX") as string);
    const clickY = parseFloat(formData.get("clickY") as string);
    const userEmail = formData.get("email") as string;

    if (!image || isNaN(clickX) || isNaN(clickY)) {
      return NextResponse.json({ error: "Missing image or click position" }, { status: 400 });
    }

    // Auth only — detect is free (credit charged on furniture swap)
    if (!userEmail) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    const prompt = `This is an interior room photograph. The user clicked at position ${clickX.toFixed(1)}% from the left and ${clickY.toFixed(1)}% from the top of the image.

Identify the furniture or object the user clicked on. Respond in JSON format only:
{
  "item": "the furniture/object name in English (e.g. sofa, dining table, bed, armchair, bookshelf, rug, curtains, lamp, coffee table)",
  "itemHe": "שם הרהיט בעברית",
  "description": "תיאור קצר בעברית (צבע, סגנון, חומר)",
  "suggestions": ["הצעה 1 בעברית", "הצעה 2 בעברית", "הצעה 3 בעברית"]
}

"suggestions" should be 3 alternative furniture styles in HEBREW that the user might want (e.g., for a sofa: "ספה פינתית מודרנית באפור", "ספת עור קוניאק בסגנון רטרו", "ספת פשתן סקנדינבית בקרם"). "description" must also be in Hebrew.

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
            temperature: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini detect-furniture error:", err);
      return NextResponse.json({ error: "Furniture detection failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not identify furniture", raw: text }, { status: 500 });
    }

    const info = JSON.parse(jsonMatch[0]);
    return NextResponse.json(info);
  } catch (error: any) {
    console.error("Detect furniture error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
