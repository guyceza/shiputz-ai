import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) return NextResponse.json({ error: "Missing image" }, { status: 400 });

    const base64 = image.replace(/^data:image\/\w+;base64,/, "");
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.TEXT_FAST}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType: "image/jpeg", data: base64 } },
              { text: `אתה מעצב פנים מומחה. נתח את התמונה הזו וזהה את סגנון העיצוב.

ספק:
1. **סגנון עיקרי**: מהו סגנון העיצוב (מינימליסטי, בוהו, תעשייתי, סקנדינבי, מודרני, כפרי, ים-תיכוני, מזרחי, Art Deco וכו')
2. **מאפיינים**: מה מאפיין את הסגנון בתמונה
3. **חומרים מזוהים**: עץ, מתכת, אבן, בד, זכוכית וכו'
4. **תאורה**: סוג התאורה והאווירה
5. **רשימת קניות**: 8-10 פריטים ספציפיים שצריך לקנות כדי לשחזר את הסגנון הזה (כולל סוג, חומר, צבע, טווח מחירים משוער בשקלים)
6. **טיפים לשחזור**: 3-5 טיפים פרקטיים

החזר JSON בלבד:
{
  "style": "שם הסגנון",
  "styleEnglish": "Style Name",
  "confidence": 85,
  "characteristics": ["מאפיין 1", "מאפיין 2"],
  "materials": [{"name": "עץ אלון", "usage": "רצפה ורהיטים"}],
  "lighting": {"type": "חמה/קרה/טבעית", "description": "תיאור"},
  "shoppingList": [
    {"item": "ספה", "description": "ספת בד פשתן בגוון טבעי", "material": "פשתן", "priceRange": "₪3,000-8,000", "searchQuery": "ספה פשתן סקנדינבית מודרנית"}
  ],
  "tips": ["טיפ 1", "טיפ 2"]
}` }
            ]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Style matcher error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
