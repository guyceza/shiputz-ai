export const runtime = "nodejs";
export const maxDuration = 60; // 60 second timeout

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 30 requests per minute
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 30, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: "יותר מדי בקשות. נסה שוב בעוד דקה." 
      }, { status: 429 });
    }
    
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
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
                  text: `אתה מנתח קבלות וחשבוניות בעברית. חשוב: קרא גם כתב יד וטקסט חופשי!

נתח את התמונה והחזר JSON בפורמט הבא בלבד (ללא טקסט נוסף, ללא markdown, ללא \`\`\`):
{
  "description": "תיאור העבודה/השירות - קרא מכתב יד אם יש (2-10 מילים)",
  "amount": מספר (הסכום הסופי לתשלום),
  "category": "אחת מהקטגוריות: חומרי בניין, עבודה, חשמל, אינסטלציה, ריצוף, צבע, מטבח, אמבטיה, אחר",
  "vendor": "שם העסק/בעל המקצוע - קרא גם מכותרת או חותמת",
  "date": "תאריך בפורמט YYYY-MM-DD (המר תאריכים כמו 9/5/33 ל-2033-05-09)",
  "items": [
    {"name": "שם פריט", "quantity": כמות, "price": מחיר}
  ],
  "fullText": "כל הטקסט הקריא - מסודר בשורות נפרדות עם ירידת שורה (\\n) בין חלקים שונים",
  "vatIncluded": true/false,
  "vatAmount": סכום מע"מ אם מצוין
}

חשוב: אם יש כתב יד - קרא אותו והכנס ל-description ול-fullText!
אם לא ניתן לזהות שדה - החזר null. החזר JSON תקין בלבד.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", response.status, error);
      return NextResponse.json({ 
        error: "AI scan failed", 
        details: error.substring(0, 200),
        status: response.status 
      }, { status: 500 });
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Debug: return raw content if empty
    if (!content) {
      return NextResponse.json({ 
        error: "Empty AI response", 
        debug: JSON.stringify(data).substring(0, 500) 
      }, { status: 422 });
    }

    // Parse JSON from response - strip markdown code blocks first
    try {
      // Remove markdown code blocks if present
      let cleanContent = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch (e) {
      return NextResponse.json({ 
        error: "JSON parse failed", 
        content: content.substring(0, 300) 
      }, { status: 422 });
    }

    return NextResponse.json({ error: "No JSON in response", content: content.substring(0, 300) }, { status: 422 });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
// Sun Feb 22 08:32:03 UTC 2026
