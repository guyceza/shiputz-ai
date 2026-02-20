import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "placeholder") {
      // Demo responses
      const demoResponses: Record<string, string> = {
        "תקציב": `לפי הנתונים שלך:
• תקציב: ₪${context?.budget?.toLocaleString() || "לא הוגדר"}
• הוצאות עד כה: ₪${context?.spent?.toLocaleString() || 0}
• נותר: ₪${context?.remaining?.toLocaleString() || 0}

${context?.remaining < 0 ? "⚠️ שים לב - חרגת מהתקציב!" : context?.remaining < context?.budget * 0.2 ? "⚠️ נשאר לך פחות מ-20% מהתקציב" : "✅ אתה בטווח סביר"}`,
        
        "חוזה": `דברים חשובים לבדוק בחוזה עם קבלן:

1. ✅ לוח זמנים מפורט עם תאריכים
2. ✅ פירוט מחירים לכל סעיף
3. ✅ תנאי תשלום לפי התקדמות
4. ✅ אחריות - לפחות שנה
5. ✅ סעיף קנסות על איחורים
6. ✅ פירוט חומרים ומותגים
7. ✅ אישור ביטוחים

⚠️ אל תחתום בלי שכל אלה מופיעים!`,

        "חסוך": `טיפים לחיסכון בשיפוץ:

1. 💡 השווה לפחות 3 הצעות מחיר
2. 💡 קנה חומרים בעצמך (אל תתן לקבלן)
3. 💡 תזמן את השיפוץ לעונה שקטה (חורף)
4. 💡 היה גמיש לגבי מותגים
5. 💡 בדוק מבצעים בחנויות DIY
6. 💡 שקול לעשות עבודות פשוטות בעצמך

💰 חיסכון ממוצע: 15-25% מהתקציב`,

        "default": `אני כאן לעזור לך עם השיפוץ!

אני יכול לעזור עם:
• ניתוח תקציב והוצאות
• טיפים לחוזים עם קבלנים
• המלצות לחיסכון
• בדיקת מחירים
• כל שאלה אחרת על שיפוצים

מה תרצה לדעת?`
      };

      let response = demoResponses["default"];
      if (message.includes("תקציב") || message.includes("סביר")) {
        response = demoResponses["תקציב"];
      } else if (message.includes("חוזה") || message.includes("קבלן")) {
        response = demoResponses["חוזה"];
      } else if (message.includes("חסוך") || message.includes("לחסוך") || message.includes("עלויות")) {
        response = demoResponses["חסוך"];
      }

      return NextResponse.json({ response });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `אתה עוזר AI מומחה לשיפוצים בישראל. אתה עוזר לבעלי בתים לנהל את השיפוץ שלהם בצורה חכמה.

הקשר על הפרויקט הנוכחי:
- שם הפרויקט: ${context?.projectName || "לא צוין"}
- תקציב: ₪${context?.budget?.toLocaleString() || "לא הוגדר"}
- הוצאות עד כה: ₪${context?.spent?.toLocaleString() || 0}
- נותר: ₪${context?.remaining?.toLocaleString() || 0}
- מספר הוצאות: ${context?.expensesCount || 0}

ענה בעברית, בצורה ידידותית ומעשית. תן עצות קונקרטיות ושימושיות.`,
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", await response.text());
      return NextResponse.json({ error: "AI failed" }, { status: 500 });
    }

    const data = await response.json();
    const aiResponse = data.content?.[0]?.text || "מצטער, לא הצלחתי לענות";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
