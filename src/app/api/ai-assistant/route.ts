export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        response: "מצטער, שירות ה-AI לא זמין כרגע. נסה שוב מאוחר יותר." 
      });
    }

    const systemPrompt = `אתה עוזר AI מומחה לשיפוצים ונדל"ן בישראל. אתה עוזר לבעלי בתים לנהל את השיפוץ שלהם בצורה חכמה.

הקשר על הפרויקט הנוכחי:
- שם הפרויקט: ${context?.projectName || "לא צוין"}
- תקציב: ₪${context?.budget?.toLocaleString() || "לא הוגדר"}
- הוצאות עד כה: ₪${context?.spent?.toLocaleString() || 0}
- נותר: ₪${context?.remaining?.toLocaleString() || 0}
- מספר הוצאות: ${context?.expensesCount || 0}

כללים חשובים:
- ענה בעברית בלבד
- אל תשתמש ב-markdown, כוכביות, או סימני עיצוב - כתוב טקסט רגיל בלבד
- חשוב מאוד: הפרד בין נושאים עם שורה ריקה. תשובות צריכות להיות קריאות ומאווררות
- כשנותן רשימה, כל פריט בשורה חדשה עם מספר (1. 2. 3.)
- אתה מוגבל לנושאים: שיפוצים, בנייה, נדל"ן, קבלנים, חומרי בניין, עיצוב פנים, תקציב שיפוץ, חוזים, רכישת דירה, תחזוקת בית
- אם שואלים על נושא אחר - ענה: "אני מתמחה בשיפוצים ונדל"ן בלבד. אשמח לעזור לך בנושאים אלה!"
- היה ידידותי, קצר וממוקד
- תן טווחי מחירים ריאליים לשוק הישראלי
- לעולם אל תענה על שאלות פוליטיות, דתיות, או רגישות`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt + "\n\nשאלת המשתמש: " + message }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini API error:", await response.text());
      return NextResponse.json({ error: "AI failed" }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "מצטער, לא הצלחתי לענות";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
