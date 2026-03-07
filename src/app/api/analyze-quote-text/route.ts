export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { getMidragPricingReference } from "@/lib/pricing-data";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

import { createServiceClient } from '@/lib/supabase';

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
    const { text, budget, userEmail } = body;

    // Auth check
    if (!userEmail) {
      return NextResponse.json({ error: "נדרשת התחברות לשימוש בשירות זה" }, { status: 401 });
    }
    const { exists, premium } = await verifyUserPremium(userEmail);
    if (!exists) {
      return NextResponse.json({ error: "נדרשת התחברות לשימוש בשירות זה" }, { status: 401 });
    }
    if (!premium) {
      return NextResponse.json({ error: "ניתוח הצעות מחיר זמין למשתמשי Pro בלבד. רכשו Pro כדי ליהנות מניתוח AI." }, { status: 403 });
    }

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

פורמט התשובה (חובה לעקוב בדיוק!):

שורה ראשונה - הערכה כללית (מילה אחת בלבד מתוך: מציאה / סביר / יקר / יקר_מדי):
VERDICT: [מציאה/סביר/יקר/יקר_מדי]

אחר כך הניתוח הקצר:

סיכום
[משפט אחד]

השוואת מחירים
- [פריט]: [מחיר] → שוק [טווח] = [הערכה]

המלצה
[משפט אחד]

חשוב: מקסימום 100 מילים אחרי ה-VERDICT. קצר וממוקד!`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.TEXT_FAST}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1500,
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
    const rawAnalysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לנתח את ההצעה";

    // Check if AI detected invalid input
    if (rawAnalysis.trim() === "INVALID_QUOTE" || rawAnalysis.includes("INVALID_QUOTE")) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    // Parse verdict from response
    let verdict: "great" | "ok" | "expensive" | "very_expensive" = "ok";
    let analysis = rawAnalysis;
    
    const verdictMatch = rawAnalysis.match(/VERDICT:\s*(מציאה|סביר|יקר|יקר_מדי)/i);
    if (verdictMatch) {
      const verdictText = verdictMatch[1];
      if (verdictText === "מציאה") verdict = "great";
      else if (verdictText === "סביר") verdict = "ok";
      else if (verdictText === "יקר") verdict = "expensive";
      else if (verdictText === "יקר_מדי") verdict = "very_expensive";
      
      // Remove the VERDICT line and any standalone verdict words from analysis
      analysis = rawAnalysis
        .replace(/VERDICT:\s*(מציאה|סביר|יקר|יקר_מדי)\n?/i, "")
        .replace(/^(מציאה|סביר|יקר|יקר_מדי)\s*$/gm, "")
        .replace(/^\*{0,2}(מציאה|סביר|יקר|יקר_מדי)\*{0,2}\s*$/gm, "")
        .replace(/^סיכום\s*$/gm, "")
        .replace(/^\*{0,2}סיכום\*{0,2}\s*$/gm, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    return NextResponse.json({ analysis, verdict });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json({ error: "שגיאה פנימית. נסה שוב." }, { status: 500 });
  }
}
