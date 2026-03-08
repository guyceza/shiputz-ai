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
              { text: `אתה מהנדס בניין מנוסה. נתח את התמונה הזו והעריך את מידות החדר.

השתמש ברמזים ויזואליים (דלתות ~2m גובה, ~0.8m רוחב, חלונות, רהיטים סטנדרטיים) כדי להעריך:

1. **מידות משוערות**: אורך, רוחב, גובה (במטרים)
2. **שטח רצפה**: מ"ר
3. **שטח קירות**: מ"ר (כולל הפחתה לחלונות/דלתות)
4. **נפח**: מ"ק
5. **היקף**: מטרים (לחישוב פנלים/לישטים)
6. **חישובי חומרים**:
   - אריחי רצפה 60×60: כמות (כולל 10% פחת)
   - צבע לקירות: ליטרים (2 שכבות, 10 מ"ר/ליטר)
   - פנלים/לישטים: מטרים
7. **רמת ביטחון**: אחוז (כמה בטוח בהערכה)
8. **רמזים שזוהו**: מה השתמשת כדי להעריך

⚠️ הדגש שאלו הערכות בלבד ולא מדידות מדויקות!

החזר JSON בלבד:
{
  "dimensions": {
    "length": 4.2,
    "width": 3.5,
    "height": 2.7,
    "unit": "מטרים"
  },
  "calculations": {
    "floorArea": 14.7,
    "wallArea": 38.6,
    "volume": 39.7,
    "perimeter": 15.4
  },
  "materials": {
    "tiles60x60": {"quantity": 45, "note": "כולל 10% פחת"},
    "paintLiters": {"quantity": 8, "note": "2 שכבות"},
    "baseboardMeters": {"quantity": 15.4, "note": "היקף החדר"}
  },
  "confidence": 70,
  "cluesUsed": ["דלת סטנדרטית 2m", "מיטה זוגית ~1.6m"],
  "disclaimer": "הערכה בלבד — למדידה מדויקת יש להשתמש במטר"
}` }
            ]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
