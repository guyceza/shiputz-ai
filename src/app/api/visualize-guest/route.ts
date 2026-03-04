export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { trackRequest } from "@/lib/usage-monitor";
import { createServiceClient } from "@/lib/supabase";

// Guest rate limit: 1 generation per IP per 24 hours
const GUEST_LIMIT = 1;
const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// Cost estimation logic (copied from main endpoint to avoid shared module changes)
interface CostItem {
  description: string;
  quantity: string;
  unitPrice: number;
  total: number;
}

interface CostEstimate {
  items: CostItem[];
  subtotal: number;
  laborPercent: number;
  labor: number;
  total: number;
  confidence: string;
}

function calculateCosts(analysisText: string, roomSize: number = 20): CostEstimate {
  const items: CostItem[] = [];
  const lowercaseText = analysisText.toLowerCase();
  
  const costRules: { keywords: string[]; name: string; perUnit: number; unit: string; estimateQty: (size: number) => number }[] = [
    { keywords: ["פרקט", "parquet", "עץ", "wood floor", "רצפת עץ"], name: "פרקט / רצפת עץ", perUnit: 230, unit: "מ״ר", estimateQty: (size) => size * 1.1 },
    { keywords: ["ריצוף", "אריחים", "tiles", "קרמיקה", "ceramic", "פורצלן"], name: "ריצוף / אריחים", perUnit: 180, unit: "מ״ר", estimateQty: (size) => size * 1.1 },
    { keywords: ["צביעה", "צבע", "paint", "קיר", "wall color"], name: "צביעה", perUnit: 40, unit: "מ״ר", estimateQty: (size) => size * 3 },
    { keywords: ["תאורה שקועה", "ספוטים", "spots", "spotlights", "תאורת ספוט"], name: "תאורה שקועה (ספוטים)", perUnit: 300, unit: "יחידה", estimateQty: (size) => Math.ceil(size / 3) },
    { keywords: ["תאורה עקיפה", "led", "לד", "סרט תאורה", "indirect"], name: "תאורה עקיפה LED", perUnit: 150, unit: "מטר", estimateQty: (size) => Math.ceil(Math.sqrt(size) * 2) },
    { keywords: ["גבס", "גבס דקורטיבי", "תקרת גבס", "drywall", "gypsum"], name: "תקרת / קיר גבס", perUnit: 175, unit: "מ״ר", estimateQty: (size) => size },
    { keywords: ["ארון", "ארונות", "closet", "cabinet", "ארון קיר"], name: "ארון קיר", perUnit: 2500, unit: "מטר", estimateQty: () => 2.5 },
    { keywords: ["מטבח", "kitchen", "ארונות מטבח"], name: "ארונות מטבח", perUnit: 3500, unit: "מטר", estimateQty: () => 4 },
    { keywords: ["משטח שיש", "שיש", "granite", "קוורץ", "quartz", "משטח עבודה"], name: "משטח שיש / קוורץ", perUnit: 1200, unit: "מטר", estimateQty: () => 3 },
    { keywords: ["חיפוי", "חיפוי קרמיקה", "backsplash", "קרמיקה לקיר"], name: "חיפוי קרמיקה", perUnit: 350, unit: "מ״ר", estimateQty: () => 3 },
    { keywords: ["אמבטיה", "מקלחת", "bathroom", "shower"], name: "שיפוץ חדר רחצה", perUnit: 15000, unit: "יחידה", estimateQty: () => 1 },
    { keywords: ["כיור", "sink", "ברז", "faucet"], name: "כיור + ברז", perUnit: 1500, unit: "יחידה", estimateQty: () => 1 },
    { keywords: ["חלון", "window", "חלונות"], name: "החלפת חלון", perUnit: 2500, unit: "יחידה", estimateQty: () => 1 },
    { keywords: ["דלת", "door", "דלתות"], name: "החלפת דלת", perUnit: 1800, unit: "יחידה", estimateQty: () => 1 },
  ];

  for (const rule of costRules) {
    const matched = rule.keywords.some(kw => lowercaseText.includes(kw));
    if (matched) {
      const qty = rule.estimateQty(roomSize);
      items.push({ description: rule.name, quantity: `${qty} ${rule.unit}`, unitPrice: rule.perUnit, total: Math.round(qty * rule.perUnit) });
    }
  }

  if (items.length === 0) {
    items.push({ description: "עבודות שיפוץ כלליות", quantity: `${roomSize} מ״ר`, unitPrice: 500, total: roomSize * 500 });
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const laborPercent = 25;
  const labor = Math.round(subtotal * (laborPercent / 100));
  const total = subtotal + labor;

  return { items, subtotal, laborPercent, labor, total, confidence: items.length > 3 ? "גבוה" : items.length > 1 ? "בינוני" : "נמוך" };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, description } = body;

    if (!image || !description) {
      return NextResponse.json({ error: "Missing required fields: image and description" }, { status: 400 });
    }

    // Rate limit: check cookie first (fast client-side check)
    const guestCookie = request.cookies.get('shiputz_guest_trial')?.value;
    if (guestCookie === 'true') {
      return NextResponse.json({ 
        error: "כבר השתמשת בניסיון החינמי. הירשם כדי ליצור הדמיות נוספות!",
        code: "GUEST_LIMIT_REACHED"
      }, { status: 429 });
    }

    // Rate limit: check Supabase for IP (persists across incognito, serverless instances)
    const clientIp = getClientId(request);
    
    try {
      const supabase = createServiceClient();
      const cutoff = new Date(Date.now() - GUEST_WINDOW_MS).toISOString();
      const { data: existing } = await supabase
        .from('guest_trials')
        .select('id')
        .eq('ip', clientIp)
        .gte('created_at', cutoff)
        .limit(1);
      
      if (existing && existing.length > 0) {
        return NextResponse.json({ 
          error: "כבר השתמשת בניסיון החינמי. הירשם כדי ליצור הדמיות נוספות!",
          code: "GUEST_LIMIT_REACHED"
        }, { status: 429 });
      }
    } catch (e) {
      console.error("Guest trial Supabase check failed:", e);
    }

    // Fallback: in-memory rate limit by IP
    const clientId = `guest:${clientIp}`;
    const rateLimit = checkRateLimit(clientId, GUEST_LIMIT, GUEST_WINDOW_MS);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: "כבר השתמשת בניסיון החינמי. הירשם כדי ליצור הדמיות נוספות!",
        code: "GUEST_LIMIT_REACHED"
      }, { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment");
      return NextResponse.json({ error: "API key not configured." }, { status: 500 });
    }

    // Extract base64 data
    let imageBase64 = image;
    let mimeType = "image/jpeg";
    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      }
    }

    // Step 1: Gemini analysis
    const geminiUrl = `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${apiKey}`;

    const geminiPayload = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          {
            text: `אתה מומחה שיפוצים. בקשת השינוי: "${description}"

כתוב ניתוח טכני קצר בעברית (3-4 משפטים):
- תיאור המצב הקיים בתמונה
- פירוט העבודות הנדרשות לביצוע השינוי
- הערות מקצועיות רלוונטיות (אם יש)

כתוב בגוף שלישי, ללא פניה ישירה למשתמש. ללא ביטויים רגשיים כמו "וואו", "מדהים", "נהדר". רק עובדות ומידע מקצועי.`
          }
        ]
      }]
    };

    const analysisController = new AbortController();
    const analysisTimeout = setTimeout(() => analysisController.abort(), 60000);

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
      signal: analysisController.signal
    }).finally(() => clearTimeout(analysisTimeout));

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Guest Gemini API error:", geminiResponse.status, errorText);

      if (geminiResponse.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
        return NextResponse.json({
          error: "יש עומס זמני על המערכת. נסה שוב בעוד כמה דקות.",
          code: "SYSTEM_OVERLOAD"
        }, { status: 503 });
      }

      return NextResponse.json({ error: "שגיאה זמנית בשירות. נסה שוב." }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Step 2: Calculate costs
    const costEstimate = calculateCosts(analysisText + " " + description);

    // Step 3: Image generation
    const editPrompt = `You are editing a room photo for a renovation visualization.

THE CHANGE REQUESTED: ${description}

INSTRUCTIONS:
1. MAKE THE CHANGE - Actually perform what was requested. If they ask to remove a wall, remove it and show the open space behind it.
2. KEEP THE ROOM - Same angle, same lighting, same floor, same other furniture
3. SHOW RESULTS - The image should show a finished, clean renovation result

If the request is to "remove wall", "break wall", or "open the space" - you MUST show the wall removed with a clear view of what's behind/beyond it. This is a renovation visualization - show what it would look like AFTER the renovation is complete.`;

    const editPayload = {
      contents: [{
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: editPrompt }
        ]
      }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
    };

    let generatedImage: string | null = null;

    try {
      const imageController = new AbortController();
      const imageTimeout = setTimeout(() => imageController.abort(), 60000);

      const editResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPayload),
        signal: imageController.signal
      }).finally(() => clearTimeout(imageTimeout));

      if (editResponse.ok) {
        const editData = await editResponse.json();
        const candidate = editData.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (finishReason === "OTHER" || finishReason === "SAFETY") {
          return NextResponse.json({
            success: false,
            error: "IMAGE_NOT_SUPPORTED",
            message: "לא ניתן לעבד את התמונה הזו. נסה להעלות תמונה אחרת של החדר.",
            analysis: analysisText,
            costs: costEstimate
          });
        }

        const parts = candidate?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          } else if (part.inline_data?.mime_type?.startsWith("image/")) {
            generatedImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
        }

        if (!generatedImage) {
          return NextResponse.json({
            success: false,
            error: "IMAGE_NOT_SUPPORTED",
            message: "לא ניתן לעבד את התמונה הזו. נסה להעלות תמונה אחרת של החדר.",
            analysis: analysisText,
            costs: costEstimate
          });
        }
      } else {
        const errorText = await editResponse.text();
        console.error("Guest image gen error:", editResponse.status, errorText);

        if (editResponse.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
          return NextResponse.json({
            success: false,
            error: "SYSTEM_OVERLOAD",
            message: "יש עומס זמני על המערכת. נסה שוב בעוד כמה דקות.",
            analysis: analysisText,
            costs: costEstimate
          }, { status: 503 });
        }

        return NextResponse.json({
          success: false,
          error: "API_ERROR",
          message: "שגיאה בעיבוד התמונה. נסה שוב.",
          analysis: analysisText,
          costs: costEstimate
        });
      }
    } catch (editError: any) {
      console.error("Guest image edit failed:", editError);
      const isTimeout = editError?.name === 'AbortError' || editError?.message?.includes('abort');
      return NextResponse.json({
        success: false,
        error: isTimeout ? "TIMEOUT" : "API_ERROR",
        message: isTimeout
          ? "העיבוד לקח יותר מדי זמן. נסה שוב עם תמונה קטנה יותר או תיאור קצר יותר."
          : "שגיאה בעיבוד התמונה. נסה שוב.",
        analysis: analysisText,
        costs: costEstimate
      });
    }

    // Track successful guest request
    trackRequest('/api/visualize-guest', false);

    // Save IP to Supabase for persistent rate limiting (BLOCKING - must complete before response)
    try {
      const supabase = createServiceClient();
      const { error: saveError } = await supabase.from('guest_trials').insert({ ip: clientIp });
      if (saveError) console.error("Failed to save guest trial:", saveError.message);
    } catch (e) {
      console.error("Failed to save guest trial to Supabase:", e);
    }

    const response = NextResponse.json({
      success: true,
      analysis: analysisText,
      generatedImage,
      costs: costEstimate,
      description,
      guest: true
    });

    // Set cookie to prevent reuse (survives serverless instance changes + localStorage clears)
    response.cookies.set('shiputz_guest_trial', 'true', {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // allow JS to read it too
      secure: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;

  } catch (error) {
    trackRequest('/api/visualize-guest', true);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Guest visualize API error:", errorMessage, error);
    return NextResponse.json({
      error: "אירעה שגיאה בעיבוד התמונה. נסה שוב מאוחר יותר.",
      code: "SERVER_ERROR"
    }, { status: 500 });
  }
}
