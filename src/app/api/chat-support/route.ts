export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";

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
- ₪149.99 תשלום חד פעמי (במקום ₪299.99 - מבצע 50% הנחה)
- לכל משך הפרויקט, ללא הגבלת זמן
- ללא מנוי חודשי
- ללא כרטיס אשראי לתקופת נסיון

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
5. תשובות קצרות וממוקדות (2-3 משפטים מקסימום)
6. השתמש באימוג'ים במידה 👍`;

// Simple rate limiting (10 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (limit.count >= 10) {
    return false;
  }
  
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "יותר מדי בקשות. נסה שוב בעוד דקה." },
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: "שגיאה בשרת. נסה שוב." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "מצטער, לא הצלחתי לעבד את ההודעה. נסה שוב.";

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "שגיאה בעיבוד ההודעה. נסה שוב." },
      { status: 500 }
    );
  }
}
