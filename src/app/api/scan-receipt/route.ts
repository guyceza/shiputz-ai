export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      // Demo mode - return mock data
      return NextResponse.json({
        description: "קבלה לדוגמה",
        amount: Math.floor(Math.random() * 1000) + 100,
        category: "חומרי בניין",
        vendor: "חנות לדוגמה",
        date: new Date().toISOString().split('T')[0],
        items: [],
        fullText: "מצב דמו - אין API key",
      });
    }

    // Extract base64 data
    const base64Data = image.split(",")[1] || image;
    const mimeType = image.includes("image/png") ? "image/png" : "image/jpeg";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: `אתה מנתח קבלות וחשבוניות בעברית. נתח את התמונה והחזר JSON בפורמט הבא בלבד (ללא טקסט נוסף, ללא markdown, ללא \`\`\`):
{
  "description": "תיאור קצר של הקבלה/העסקה (2-5 מילים)",
  "amount": מספר (הסכום הסופי לתשלום, ללא מע"מ אם מצוין בנפרד),
  "category": "אחת מהקטגוריות: חומרי בניין, עבודה, חשמל, אינסטלציה, ריצוף, צבע, מטבח, אמבטיה, אחר",
  "vendor": "שם העסק/בעל המקצוע",
  "date": "תאריך בפורמט YYYY-MM-DD אם מצוין",
  "items": [
    {"name": "שם פריט", "quantity": כמות, "price": מחיר ליחידה}
  ],
  "fullText": "כל הטקסט הקריא מהקבלה",
  "vatIncluded": true/false,
  "vatAmount": סכום מע"מ אם מצוין
}

אם לא ניתן לזהות שדה - החזר null. החזר JSON תקין בלבד.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json({ error: "AI scan failed" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      console.error("Failed to parse AI response:", content);
    }

    return NextResponse.json({ error: "Could not parse receipt" }, { status: 422 });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
