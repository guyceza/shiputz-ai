export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { creditGuard } from "@/lib/credit-guard";
import { refundCreditCharge } from "@/lib/credit-refunds";
import { claimShavuotGiftAfterSuccessfulAction } from "@/lib/gift-campaigns";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { getMidragPricingReference } from "@/lib/pricing-data";

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
  let chargedUserEmail: string | null = null;
  let chargedCost = 0;
  const refundIfNeeded = (reason: string) =>
    refundCreditCharge(chargedUserEmail, chargedCost, `analyze-quote_${reason}`);

  try {
    const body = await request.json();
    const { image, budget, userEmail } = body;

    // Auth check - verify user exists in DB
    if (!userEmail) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }
    
    const { exists } = await verifyUserPremium(userEmail);
    if (!exists) {
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

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        analysis: "מצטער, שירות ה-AI לא זמין כרגע. נסה שוב מאוחר יותר." 
      });
    }

    const creditCheck = await creditGuard(userEmail, 'analyze-quote');
    if ('error' in creditCheck) return creditCheck.error;
    chargedUserEmail = userEmail;
    chargedCost = creditCheck.cost;

    const base64Data = image.split(",")[1] || image;
    const mimeType = image.includes("image/png") ? "image/png" : "image/jpeg";

    // Get real market pricing data from Midrag
    const midragPricing = getMidragPricingReference();
    
    const prompt = `אתה מומחה לניתוח הצעות מחיר לשיפוצים בישראל. נתח את הצעת המחיר בתמונה והשווה אותה למחירי השוק האמיתיים.

${budget ? `התקציב הכולל של הלקוח: ₪${budget}` : ""}

=== מחירי שוק אמיתיים (מידרג) ===
${midragPricing}

=== הנחיות לניתוח ===

1. 📊 סיכום כללי
   - האם ההצעה סבירה ביחס למחירי מידרג?
   - ציין אם המחיר הכולל גבוה/נמוך/סביר

2. 💰 השוואת מחירים (חשוב!)
   - לכל פריט בהצעה: מה המחיר המוצע vs מחיר מידרג
   - סמן ב-✅ מחיר סביר | ⚠️ יקר ב-10-25% | ❌ יקר מדי (25%+) | 🟢 מציאה

3. ✅ נקודות חיוביות
   - מה כלול בהצעה שזה יתרון?
   
4. ⚠️ חסרים או מחשידים
   - מה לא מפורט שצריך להיות?
   - עבודות שנראות "חבילה" בלי פירוט

5. 🚩 דגלים אדומים
   - מחירים חריגים (גבוהים או נמוכים מדי)
   - סימנים מדאיגים

6. 💡 המלצות
   - על מה לנהל מו"מ?
   - מה לבקש לפני חתימה?

כתוב בעברית, בצורה ברורה. היה ספציפי עם מספרים - השווה כל מחיר לטווח מידרג.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.VISION_FAST}:generateContent?key=${GEMINI_API_KEY}`,
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
      await refundIfNeeded("ai_error");
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "לא הצלחתי לנתח את ההצעה";
    if (!analysis || analysis === "לא הצלחתי לנתח את ההצעה") {
      await refundIfNeeded("empty_response");
      return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
    }

    chargedUserEmail = null;
    chargedCost = 0;
    const giftClaim = await claimShavuotGiftAfterSuccessfulAction(request, userEmail, 'analyze-quote');
    return NextResponse.json({ analysis, giftClaim });
  } catch {
    await refundIfNeeded("server_error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
