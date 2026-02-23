export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { getMidragPricingReference } from "@/lib/pricing-data";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, budget } = body;

    // Rate limiting - 20 requests per minute
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 20, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: "יותר מדי בקשות. נסה שוב בעוד דקה." 
      }, { status: 429 });
    }

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ 
        error: "INVALID_INPUT" 
      }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        analysis: "מצטער, שירות ה-AI לא זמין כרגע. נסה שוב מאוחר יותר." 
      });
    }

    const midragPricing = getMidragPricingReference();

    const prompt = `אתה מומחה לניתוח הצעות מחיר לשיפוצים בישראל.

=== קלט מהמשתמש ===
${text}

${budget ? `תקציב הלקוח: ₪${budget}` : ""}

חשוב מאוד: אם הקלט לא מכיל הצעת מחיר ברורה (עבודה + מחיר), החזר בדיוק את הטקסט הזה ותו לא:
INVALID_QUOTE

אם יש הצעת מחיר תקינה, המשך לניתוח:

=== מחירי שוק אמיתיים (מידרג - 2.8 מיליון ביקורות) ===
${midragPricing}

=== הנחיות ===
לכל פריט בהצעה:
1. זהה את סוג העבודה
2. מצא את מחיר השוק המקביל מהנתונים למעלה
3. השווה והערך:
   - "סביר" - בטווח השוק
   - "יקר" - 10-25% מעל השוק
   - "יקר מדי" - 25%+ מעל השוק
   - "מציאה" - מתחת לשוק

פורמט התשובה (ללא אימוג'ים, ללא כוכביות):

סיכום
[משפט אחד - סביר/יקר/מציאה]

השוואת מחירים
- [פריט]: [מחיר מוצע] ש"ח
  מחיר שוק: [טווח] ש"ח
  הערכה: [סביר / יקר ב-X% / יקר מדי - X% מעל / מציאה]

המלצה
[משפט או שניים - מה לעשות]

כתוב בעברית, קצר וממוקד. אל תשתמש באימוג'ים או בכוכביות להדגשה.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.TEXT_FAST}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return NextResponse.json({ error: "שגיאה בניתוח. נסה שוב." }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לנתח את ההצעה";

    // Check if AI detected invalid input
    if (analysis.trim() === "INVALID_QUOTE" || analysis.includes("INVALID_QUOTE")) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "שגיאה פנימית. נסה שוב." }, { status: 500 });
  }
}
