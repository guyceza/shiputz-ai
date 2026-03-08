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
              { text: `אתה מעצב פנים מקצועי. נתח את התמונה הזו וספק:

1. **צבעים נוכחיים**: זהה את 5 הצבעים הדומיננטיים בחדר (HEX + שם בעברית)
2. **פלטה מומלצת 1 - מודרני**: 5 צבעים שישדרגו את החדר לסגנון מודרני (HEX + שם + איפה להשתמש)
3. **פלטה מומלצת 2 - חמים**: 5 צבעים חמים ומזמינים (HEX + שם + איפה להשתמש)
4. **פלטה מומלצת 3 - סקנדינבי**: 5 צבעים בסגנון נורדי (HEX + שם + איפה להשתמש)
5. **המלצת צבע ספציפית**: שם גוון של נירלט או טמבור שמתאים לקירות

החזר JSON בלבד בפורמט:
{
  "currentColors": [{"hex": "#xxx", "name": "שם", "location": "היכן בחדר"}],
  "palettes": [
    {
      "name": "שם הפלטה",
      "description": "תיאור קצר",
      "colors": [{"hex": "#xxx", "name": "שם", "usage": "קירות/רצפה/אביזרים"}]
    }
  ],
  "paintRecommendation": {"brand": "נירלט/טמבור", "shade": "שם הגוון", "code": "קוד"}
}` }
            ]
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 4096 }
        })
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
    
    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
