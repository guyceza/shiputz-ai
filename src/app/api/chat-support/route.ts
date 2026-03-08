export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
// Bug #29 fix: Use shared rate limiter instead of duplicating logic
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `אתה נציג תמיכה ומכירות של ShiputzAI - מערכת לניהול שיפוצים עם בינה מלאכותית.

📋 מידע על המוצר:
- ShiputzAI עוזר לנהל שיפוץ בית/דירה בצורה חכמה
- מעקב תקציב בזמן אמת
- סריקת קבלות אוטומטית עם AI
- ניתוח הצעות מחיר - לדעת אם המחיר הוגן
- בדיקת חוזים - זיהוי סעיפים בעייתיים
- התראות חכמות על חריגות
- הדמיית חדרים - לראות איך השיפוץ יראה

💰 מחיר:
- 10 קרדיטים חינם בלי הרשמה, +10 עם הרשמה
- Starter: ₪29/חודש (50 קרדיטים) — הדמיות, כתב כמויות, Shop the Look, סריקת קבלות
- Pro: ₪79/חודש (200 קרדיטים) — כולל סרטון סיור, תוכנית קומה, שימוש מסחרי
- Business: ₪199/חודש (600 קרדיטים) — הכל ללא הגבלה + תמיכה עדיפה
- אפשר גם לקנות קרדיטים בודדים ללא מנוי (החל מ-₪10 ל-10 קרדיטים)
- ביטול בכל עת

🎯 קהל יעד:
- משפצים פרטיים
- זוגות צעירים שקונים דירה
- כל מי שמתכנן שיפוץ

🏆 יתרונות:
- חוסך אלפי שקלים בהשוואת הצעות מחיר
- מונע חריגות תקציב
- תיעוד מסודר של כל ההוצאות
- AI שעונה על שאלות בנושא שיפוצים

📞 יצירת קשר:
- אתר: shipazti.com
- אימייל: support@shipazti.com

הנחיות:
1. ענה בעברית, בצורה ידידותית ומקצועית
2. התמקד בערך שהמוצר נותן
3. אם מישהו מתעניין, עודד אותו להירשם
4. אם יש שאלה שאתה לא יודע - הפנה ל-support@shipazti.com
5. תשובות קצרות וברורות — 3-5 משפטים מקסימום. אם צריך רשימה, עד 5 פריטים. תמיד סיים את התשובה, לא לקטוע באמצע
6. אל תשתמש בכוכביות או סימני מרקדאון להדגשה - כתוב טקסט פשוט בלבד
7. אם שואלים על מחירי שיפוצים, הפנה להשתמש בכלי "ניתוח הצעת מחיר" שבמערכת`;

// Use base prompt only - pricing data is too large for chat context
function getFullSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export async function POST(request: NextRequest) {
  try {
    // Bug #29 fix: Use shared rate limiter (10 requests per minute per IP)
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "המערכת עמוסה כרגע. נסו שוב בעוד דקה." },
        { status: 429 }
      );
    }

    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "חסרה הודעה" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "שירות הצ'אט לא זמין כרגע" },
        { status: 500 }
      );
    }

    // Build conversation for Gemini
    const contents = [];
    
    // Add history if exists
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add current message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.TEXT_FAST}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: getFullSystemPrompt() }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limit / quota exceeded
      if (response.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
        return NextResponse.json(
          { error: "יש עומס זמני על המערכת. נסו שוב בעוד כמה דקות." },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: "שגיאה זמנית בשירות. נסו שוב." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "מצטער, לא הצלחתי לעבד את ההודעה. נסו שוב.";

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    return NextResponse.json(
      { error: "שגיאה בעיבוד ההודעה. נסו שוב." },
      { status: 500 }
    );
  }
}
