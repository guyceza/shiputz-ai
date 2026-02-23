export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Verify user is authenticated
async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => c.name.includes('sb-') && (c.name.includes('auth') || c.name.includes('session')));
    if (hasSupabaseCookie) return true;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check - require logged in user
    const isAuthenticated = await verifyAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }

    // Rate limiting - 15 requests per minute
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 15, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: "יותר מדי בקשות. נסה שוב בעוד דקה." 
      }, { status: 429 });
    }
    
    const { image, budget } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        analysis: "מצטער, שירות ה-AI לא זמין כרגע. נסה שוב מאוחר יותר." 
      });
    }

    const base64Data = image.split(",")[1] || image;
    const mimeType = image.includes("image/png") ? "image/png" : "image/jpeg";

    const prompt = `אתה מומחה לניתוח הצעות מחיר לשיפוצים בישראל. נתח את הצעת המחיר בתמונה.

${budget ? `התקציב הכולל של הלקוח: ₪${budget}` : ""}

תן ניתוח מפורט הכולל:

1. 📊 סיכום כללי - האם ההצעה נראית סבירה?

2. ✅ נקודות חיוביות - מה טוב בהצעה?

3. ⚠️ נקודות לבדיקה - מה חסר או מחשיד?

4. 💰 ניתוח מחירים - האם המחירים בטווח הסביר לשוק הישראלי? תן השוואה למחירי שוק.

5. 🚩 דגלים אדומים - סימנים מדאיגים אם יש

6. 💡 המלצות - מה לבקש מהקבלן לפני חתימה?

כתוב בעברית, בצורה ברורה ומעשית. היה ספציפי עם מספרים ועובדות.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לנתח את ההצעה";

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
