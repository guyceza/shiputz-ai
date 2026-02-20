import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { image, budget } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "placeholder") {
      // Demo mode
      return NextResponse.json({
        analysis: `📊 ניתוח הצעת מחיר (מצב דמו)

סיכום כללי:
ההצעה נראית סבירה באופן כללי, אך יש כמה נקודות לשים לב אליהן.

✅ נקודות חיוביות:
• המחירים בטווח הסביר לשוק
• יש פירוט של חומרים
• תנאי תשלום ברורים

⚠️ נקודות לבדיקה:
• לא מצוין לוח זמנים מדויק
• חסר סעיף אחריות
• כדאי לבקש פירוט של מותגי החומרים

💡 המלצות:
1. בקש לוח זמנים מפורט עם אבני דרך
2. הוסף סעיף אחריות של לפחות שנה
3. ודא שהמחיר כולל מע"מ

${budget ? `\n📈 ביחס לתקציב שלך (₪${budget.toLocaleString()}):\nההצעה נראית מתאימה לתקציב.` : ""}`
      });
    }

    const base64Data = image.split(",")[1] || image;
    const mediaType = image.includes("image/png") ? "image/png" : "image/jpeg";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: `אתה מומחה לניתוח הצעות מחיר לשיפוצים בישראל. נתח את הצעת המחיר בתמונה.

${budget ? `התקציב הכולל של הלקוח: ₪${budget}` : ""}

תן ניתוח מפורט הכולל:

1. 📊 סיכום כללי - האם ההצעה נראית סבירה?

2. ✅ נקודות חיוביות - מה טוב בהצעה?

3. ⚠️ נקודות לבדיקה - מה חסר או מחשיד?

4. 💰 ניתוח מחירים - האם המחירים בטווח הסביר לשוק הישראלי?

5. 🚩 דגלים אדומים - סימנים מדאיגים אם יש

6. 💡 המלצות - מה לבקש מהקבלן לפני חתימה?

כתוב בעברית, בצורה ברורה ומעשית.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", await response.text());
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.content?.[0]?.text || "לא הצלחתי לנתח את ההצעה";

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
