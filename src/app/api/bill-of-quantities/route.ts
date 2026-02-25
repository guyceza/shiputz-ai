import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

export async function POST(request: Request) {
  try {
    const { image, fileName } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "לא התקבלה תמונה" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "פורמט תמונה לא תקין" }, { status: 400 });
    }

    const mimeType = base64Match[1];
    const imageData = base64Match[2];

    const prompt = `אתה מומחה לכתבי כמויות ותכניות בניה בישראל.

נתח את התכנית המצורפת והפק כתב כמויות מפורט בפורמט JSON.

## הוראות:
1. זהה את סוג התכנית (דירה, בית, משרד וכו')
2. זהה כל החדרים/אזורים ושטחיהם
3. מדוד/העריך אורכי קירות (חיצוניים ופנימיים)
4. ספור דלתות וחלונות
5. חשב שטחי ריצוף
6. חשב שטחי צביעה (קירות + תקרות, גובה 2.70 מ')
7. הוסף כל אלמנט רלוונטי נוסף

## הנחות (אם לא מצוין בתכנית):
- גובה תקרה: 2.70 מ'
- עובי קיר חוץ: 20 ס"מ
- עובי קיר פנים: 10 ס"מ
- רוחב דלת פנים: 80 ס"מ
- רוחב חלון: 120 ס"מ

## פורמט התשובה (JSON בלבד!):
{
  "summary": {
    "totalArea": { "label": "שטח כולל", "value": "XX", "unit": "מ\"ר" },
    "rooms": { "label": "חדרים", "value": "X", "unit": "" },
    "walls": { "label": "קירות", "value": "XX", "unit": "מ\"א" },
    "doors": { "label": "דלתות", "value": "X", "unit": "יח'" },
    "windows": { "label": "חלונות", "value": "X", "unit": "יח'" }
  },
  "items": [
    { "category": "שטחים", "description": "סלון", "quantity": "25", "unit": "מ\"ר", "notes": "" },
    { "category": "שטחים", "description": "מטבח", "quantity": "12", "unit": "מ\"ר", "notes": "" },
    { "category": "קירות", "description": "קירות חוץ", "quantity": "35", "unit": "מ\"א", "notes": "היקף המבנה" },
    { "category": "קירות", "description": "מחיצות פנים", "quantity": "18", "unit": "מ\"א", "notes": "" },
    { "category": "פתחים", "description": "דלתות פנים", "quantity": "4", "unit": "יח'", "notes": "80 ס\"מ רוחב" },
    { "category": "פתחים", "description": "חלונות", "quantity": "5", "unit": "יח'", "notes": "120x100 ס\"מ" },
    { "category": "ריצוף", "description": "ריצוף כללי", "quantity": "85", "unit": "מ\"ר", "notes": "כולל 10% עודף" },
    { "category": "צביעה", "description": "קירות פנים", "quantity": "190", "unit": "מ\"ר", "notes": "גובה 2.70" },
    { "category": "צביעה", "description": "תקרות", "quantity": "85", "unit": "מ\"ר", "notes": "" }
  ],
  "notes": [
    "הנתונים מבוססים על ניתוח התכנית ויש לאמתם",
    "הנחת גובה תקרה: 2.70 מ'",
    "מומלץ להוסיף 10-15% לכמויות לבטיחות"
  ]
}

אם התמונה אינה תכנית בניה, החזר:
{
  "error": "התמונה אינה תכנית בניה מזוהה",
  "suggestion": "אנא העלה תכנית אדריכלית, תכנית קומות או שרטוט טכני"
}

החזר **רק JSON תקין**, ללא טקסט נוסף!`;

    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.2
        }
      })
    });

    const geminiData = await response.json();

    if (geminiData.error) {
      console.error("Gemini API error:", geminiData.error);
      return NextResponse.json({ error: "שגיאה בשירות AI" }, { status: 500 });
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Try to extract JSON from the response
    let result;
    try {
      // Try to find JSON in the response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.log("Raw response:", rawText);
      
      // Return a generic error if we can't parse the response
      return NextResponse.json({
        error: "לא הצלחנו לנתח את התכנית",
        suggestion: "נסה להעלות תכנית ברורה יותר או בפורמט אחר"
      }, { status: 400 });
    }

    // Check if AI returned an error
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error("Bill of quantities error:", error);
    return NextResponse.json({ error: "שגיאה בעיבוד הבקשה" }, { status: 500 });
  }
}
