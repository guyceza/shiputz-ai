export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

import { createServiceClient } from '@/lib/supabase';

// Verify user exists and has premium
async function verifyUserPremium(userEmail: string): Promise<{exists: boolean, premium: boolean}> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('users')
      .select('id, purchased')
      .eq('email', userEmail.toLowerCase())
      .single();
    return { exists: !!data, premium: data?.purchased === true };
  } catch {
    return { exists: false, premium: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context, userEmail } = body;

    // Auth check - verify user exists in DB
    if (!userEmail) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }
    
    const { exists, premium } = await verifyUserPremium(userEmail);
    if (!exists) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }
    
    if (!premium) {
      return NextResponse.json({ 
        error: "העוזר החכם זמין למנויי פרימיום בלבד. שדרגו את החשבון שלכם כדי ליהנות מייעוץ AI." 
      }, { status: 403 });
    }

    // Rate limiting - 20 requests per minute
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 20, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: "יותר מדי בקשות. נסה שוב בעוד דקה." 
      }, { status: 429 });
    }

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        response: "מצטער, שירות ה-AI לא זמין כרגע. נסה שוב מאוחר יותר." 
      });
    }

    const systemPrompt = `אתה עוזר פרקטי לניהול שיפוצים. המטרה שלך: לעזור, לא לבקר.

נתוני הפרויקט:
- תקציב מוגדר: ₪${context?.budget?.toLocaleString() || "לא הוגדר"}
- סה"כ הוצאות: ₪${context?.spent?.toLocaleString() || 0}
- נותר: ₪${context?.remaining?.toLocaleString() || 0}

עקרונות:
1. ענה ישירות על השאלה שנשאלה! אל תזכיר את התקציב אלא אם שאלו על התקציב
2. אם שואלים "מה האתר של X" - תן את הכתובת ותשובה קצרה
3. תן עצות פרקטיות שאפשר לבצע עכשיו
4. עברית פשוטה וברורה
5. אם שואלים על מקומות לקנות - תן שמות אתרים וחנויות אמיתיים
6. רק אם שואלים על התקציב/הוצאות - אז תתייחס לנתוני הפרויקט

אתרים ומקורות שימושיים לשיפוצים בישראל:
- יד שנייה/משומש: יד2, פייסבוק מרקטפלייס, עודפים (odafim.co.il), חנויות יד שנייה בשכונה
- חומרי בניין: אייס (ACE), הום סנטר, מחסני חשמל, לירון פרזול
- כלי עבודה: מחסני כלי עבודה, טמבור, טולמנס
- ריצוף וחיפוי: מרכז הבנייה, קרמיקה ביתן, פורצלנוסה
- מטבחים: איקאה, רהיטי דורון, מטבחי רגבה
- אונליין: עלי אקספרס (משלוח ארוך), אמזון, זאפ להשוואת מחירים

דוגמאות לתשובות טובות:

שאלה: "מה האתר של זאפ?"
תשובה: "האתר של זאפ הוא zap.co.il - אפשר להשוות מחירים של מוצרי חשמל, כלי עבודה ועוד. יש גם אפליקציה נוחה."

שאלה: "איפה כדאי לקנות ריצוף זול?"
תשובה: "כמה אפשרויות טובות לריצוף במחירים טובים:
1. מרכז הבנייה - מבצעים על עודפים
2. קרמיקה ביתן - מחירים תחרותיים
3. קבוצות פייסבוק של עודפי בניין"

שאלה: "האם התקציב שלי סביר?"
תשובה: (רק כאן להתייחס לנתוני התקציב מהמערכת)

חשוב: תמיד סיים משפטים. אל תחתוך באמצע.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.TEXT_FAST}:generateContent?key=${GEMINI_API_KEY}`,
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
            temperature: 0.8,
            maxOutputTokens: 1500,
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
