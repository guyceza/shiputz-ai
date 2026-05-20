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
              { text: `אתה מעצב פנים מומחה. נתח את התמונה הזו וזהה את סגנון העיצוב.

ספק:
1. **סגנון עיקרי**: מהו סגנון העיצוב (מינימליסטי, בוהו, תעשייתי, סקנדינבי, מודרני, כפרי, ים-תיכוני, מזרחי, Art Deco וכו')
2. **מאפיינים**: מה מאפיין את הסגנון בתמונה
3. **חומרים מזוהים**: עץ, מתכת, אבן, בד, זכוכית וכו'
4. **תאורה**: סוג התאורה והאווירה
5. **רשימת קניות**: 8-10 פריטים ספציפיים שצריך לקנות כדי לשחזר את הסגנון הזה (כולל סוג, חומר, צבע, טווח מחירים משוער בשקלים). לכל פריט, ציין את המיקום שלו בתמונה כאחוזים (0-100) מלמעלה ומשמאל.
6. **טיפים לשחזור**: 3-5 טיפים פרקטיים

IMPORTANT: For each material, include textureType from this list: wood, metal, glass, fabric, linen, stone, marble, ceramic, concrete, leather, wool, rattan, bamboo, brick, tile, velvet, cotton, plastic, paper, cork.

IMPORTANT: Position values (top, left) MUST be percentages from 0 to 100, NOT pixels! top=0 is the top edge, top=100 is the bottom. left=0 is the left edge, left=100 is the right edge.

החזר JSON בלבד:
{
  "style": "שם הסגנון",
  "styleEnglish": "Style Name",
  "confidence": 85,
  "characteristics": ["מאפיין 1", "מאפיין 2"],
  "materials": [{"name": "עץ אלון", "usage": "רצפה ורהיטים", "textureType": "wood"}],
  "lighting": {"type": "חמה/קרה/טבעית", "description": "תיאור"},
  "shoppingList": [
    {"item": "ספה", "description": "ספת בד פשתן בגוון טבעי", "material": "פשתן", "priceRange": "₪3,000-8,000", "searchQuery": "ספה פשתן סקנדינבית מודרנית", "position": {"top": 60, "left": 45}}
  ],
  "tips": ["טיפ 1", "טיפ 2"]
}` }
            ]
          }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
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
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await refundIfNeeded('empty_response');
      return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    }
    
    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
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
