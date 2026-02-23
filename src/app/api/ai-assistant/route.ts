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

    const systemPrompt = `אתה יועץ שיפוצים מקצועי. תפקידך לנתח את המצב ולהציע פתרונות יצירתיים.

נתוני הפרויקט:
- תקציב: ₪${context?.budget?.toLocaleString() || "לא הוגדר"}
- הוצאות עד כה: ₪${context?.spent?.toLocaleString() || 0}
- נותר: ₪${context?.remaining?.toLocaleString() || 0}
- מספר הוצאות: ${context?.expensesCount || 0}

איך לענות:
- סגנון מקצועי ורציני (לא "תשמע חבר" או סלנג)
- אל רק תתאר את המצב - תציע פעולות קונקרטיות
- חשוב מחוץ לקופסא - תן רעיונות שהלקוח לא חשב עליהם
- אם התקציב בבעיה, הצע דרכים לחסוך או לתעדף
- אם הכל בסדר, הצע איך לנצל את הכסף הנותר בצורה חכמה
- תן 2-3 המלצות ספציפיות לפעולה
- עברית תקנית, בלי סימני markdown
- שורות קצרות וברורות

דוגמה:
"התקציב שלך עומד על 21 ש"ח עם הוצאות של 8,400 ש"ח - יש פער משמעותי.

המלצות:
1. עדכן את התקציב הכולל לסכום ריאלי יותר
2. בדוק אילו הוצאות עתידיות צפויות ותכנן בהתאם
3. שקול לפצל את הפרויקט לשלבים לפי תקציב"

חשוב: סיים כל משפט. לעולם אל תחתוך באמצע.`;

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
