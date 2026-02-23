export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";

// Verify user is authenticated (has valid Supabase session via cookie)
async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    // Check for any Supabase auth cookie (various formats)
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => 
      c.name.includes('sb-') && (c.name.includes('auth') || c.name.includes('session'))
    );
    if (hasSupabaseCookie) return true;
    
    // Also check for auth header (for API clients)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) return true;
    
    return false;
  } catch {
    return false;
  }
}

// Verify user exists in database
async function verifyUserExists(userEmail: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail.toLowerCase())
      .single();
    
    return !!data;
  } catch {
    return false;
  }
}

// Verify user has BOTH main subscription AND vision subscription
// After trial, users need: purchased = true AND vision_subscription = true
async function verifySubscription(userEmail: string | null): Promise<{ hasPurchased: boolean, hasVision: boolean, trialUsed: boolean, monthlyUsage: number }> {
  if (!userEmail) return { hasPurchased: false, hasVision: false, trialUsed: false, monthlyUsage: 0 };
  
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('users')
      .select('purchased, vision_subscription, vision_trial_used, vision_usage_count, vision_usage_month')
      .eq('email', userEmail.toLowerCase())
      .single();
    
    // Check if we're in a new month - reset count if so
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-02"
    let usageCount = data?.vision_usage_count || 0;
    
    if (data?.vision_usage_month !== currentMonth) {
      // New month - count should be treated as 0
      usageCount = 0;
    }
    
    return { 
      hasPurchased: data?.purchased === true,
      hasVision: data?.vision_subscription === true,
      trialUsed: data?.vision_trial_used === true,
      monthlyUsage: usageCount
    };
  } catch {
    return { hasPurchased: false, hasVision: false, trialUsed: false, monthlyUsage: 0 };
  }
}

// Increment monthly usage counter (call after successful generation)
async function incrementUsage(userEmail: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Get current usage
    const { data } = await supabase
      .from('users')
      .select('vision_usage_count, vision_usage_month')
      .eq('email', userEmail.toLowerCase())
      .single();
    
    let newCount = 1;
    if (data?.vision_usage_month === currentMonth) {
      // Same month - increment
      newCount = (data.vision_usage_count || 0) + 1;
    }
    // If different month - reset to 1
    
    await supabase
      .from('users')
      .update({ 
        vision_usage_count: newCount,
        vision_usage_month: currentMonth
      })
      .eq('email', userEmail.toLowerCase());
  } catch (e) {
    console.error('Failed to increment usage:', e);
  }
}

const MONTHLY_VISION_LIMIT = 10;

// Cost estimation logic
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

// Parse description and calculate costs
function calculateCosts(analysisText: string, roomSize: number = 20): CostEstimate {
  const items: CostItem[] = [];
  const lowercaseText = analysisText.toLowerCase();
  
  // Cost rules (per unit, in ILS)
  const costRules: { keywords: string[]; name: string; perUnit: number; unit: string; estimateQty: (size: number) => number }[] = [
    { 
      keywords: ["פרקט", "parquet", "עץ", "wood floor", "רצפת עץ"],
      name: "פרקט / רצפת עץ",
      perUnit: 230,
      unit: "מ״ר",
      estimateQty: (size) => size * 1.1
    },
    { 
      keywords: ["ריצוף", "אריחים", "tiles", "קרמיקה", "ceramic", "פורצלן"],
      name: "ריצוף / אריחים",
      perUnit: 180,
      unit: "מ״ר",
      estimateQty: (size) => size * 1.1
    },
    { 
      keywords: ["צביעה", "צבע", "paint", "קיר", "wall color"],
      name: "צביעה",
      perUnit: 40,
      unit: "מ״ר",
      estimateQty: (size) => size * 3 // walls = floor * 3 approx
    },
    { 
      keywords: ["תאורה שקועה", "ספוטים", "spots", "spotlights", "תאורת ספוט"],
      name: "תאורה שקועה (ספוטים)",
      perUnit: 300,
      unit: "יחידה",
      estimateQty: (size) => Math.ceil(size / 3) // 1 spot per 3 sqm
    },
    { 
      keywords: ["תאורה עקיפה", "led", "לד", "סרט תאורה", "indirect"],
      name: "תאורה עקיפה LED",
      perUnit: 150,
      unit: "מטר",
      estimateQty: (size) => Math.ceil(Math.sqrt(size) * 2)
    },
    { 
      keywords: ["גבס", "גבס דקורטיבי", "תקרת גבס", "drywall", "gypsum"],
      name: "תקרת / קיר גבס",
      perUnit: 175,
      unit: "מ״ר",
      estimateQty: (size) => size
    },
    { 
      keywords: ["ארון", "ארונות", "closet", "cabinet", "ארון קיר"],
      name: "ארון קיר",
      perUnit: 2500,
      unit: "מטר",
      estimateQty: () => 2.5
    },
    { 
      keywords: ["מטבח", "kitchen", "ארונות מטבח"],
      name: "ארונות מטבח",
      perUnit: 3500,
      unit: "מטר",
      estimateQty: () => 4
    },
    { 
      keywords: ["משטח שיש", "שיש", "granite", "קוורץ", "quartz", "משטח עבודה"],
      name: "משטח שיש / קוורץ",
      perUnit: 1200,
      unit: "מטר",
      estimateQty: () => 3
    },
    { 
      keywords: ["חיפוי", "חיפוי קרמיקה", "backsplash", "קרמיקה לקיר"],
      name: "חיפוי קרמיקה",
      perUnit: 350,
      unit: "מ״ר",
      estimateQty: () => 3
    },
    { 
      keywords: ["אמבטיה", "מקלחת", "bathroom", "shower"],
      name: "שיפוץ חדר רחצה",
      perUnit: 15000,
      unit: "יחידה",
      estimateQty: () => 1
    },
    { 
      keywords: ["כיור", "sink", "ברז", "faucet"],
      name: "כיור + ברז",
      perUnit: 1500,
      unit: "יחידה",
      estimateQty: () => 1
    },
    { 
      keywords: ["חלון", "window", "חלונות"],
      name: "החלפת חלון",
      perUnit: 2500,
      unit: "יחידה",
      estimateQty: () => 1
    },
    { 
      keywords: ["דלת", "door", "דלתות"],
      name: "החלפת דלת",
      perUnit: 1800,
      unit: "יחידה",
      estimateQty: () => 1
    },
  ];

  // Match keywords and add to items
  for (const rule of costRules) {
    const matched = rule.keywords.some(kw => lowercaseText.includes(kw));
    if (matched) {
      const qty = rule.estimateQty(roomSize);
      items.push({
        description: rule.name,
        quantity: `${qty} ${rule.unit}`,
        unitPrice: rule.perUnit,
        total: Math.round(qty * rule.perUnit)
      });
    }
  }

  // If nothing matched, add a generic estimate
  if (items.length === 0) {
    items.push({
      description: "עבודות שיפוץ כלליות",
      quantity: `${roomSize} מ״ר`,
      unitPrice: 500,
      total: roomSize * 500
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const laborPercent = 25;
  const labor = Math.round(subtotal * (laborPercent / 100));
  const total = subtotal + labor;

  return {
    items,
    subtotal,
    laborPercent,
    labor,
    total,
    confidence: items.length > 3 ? "גבוה" : items.length > 1 ? "בינוני" : "נמוך"
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, description, userEmail } = body;

    // Auth check - verify user exists in DB (most reliable method)
    // Cookies can be unreliable, so we verify user exists with this email
    if (!userEmail) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }
    
    // Verify user exists in our database
    const userExists = await verifyUserExists(userEmail);
    if (!userExists) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }

    // Rate limiting - 10 requests per minute (expensive operation)
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: "יותר מדי בקשות. נסה שוב בעוד דקה." 
      }, { status: 429 });
    }

    if (!image || !description) {
      return NextResponse.json(
        { error: "Missing required fields: image and description" },
        { status: 400 }
      );
    }

    // Server-side subscription check
    // After trial: require BOTH main subscription (purchased) AND vision subscription
    const subscription = await verifySubscription(userEmail);
    
    // If trial not used yet, allow access (free trial)
    if (!subscription.trialUsed) {
      // Trial allowed - will be marked as used after successful generation
    } else {
      // Trial used - need both subscriptions
      if (!subscription.hasPurchased) {
        return NextResponse.json({ 
          error: "שירות זה דורש מנוי ShiputzAI פעיל",
          code: "SUBSCRIPTION_REQUIRED"
        }, { status: 403 });
      }
      if (!subscription.hasVision) {
        return NextResponse.json({ 
          error: "שירות AI Vision דורש מנוי Vision פעיל בנוסף למנוי הרגיל",
          code: "VISION_SUBSCRIPTION_REQUIRED"
        }, { status: 403 });
      }
      
      // Check monthly usage limit (10 per month for Vision subscribers)
      if (subscription.monthlyUsage >= MONTHLY_VISION_LIMIT) {
        return NextResponse.json({ 
          error: `הגעת למכסה החודשית (${MONTHLY_VISION_LIMIT} יצירות). המכסה מתאפסת בתחילת החודש הבא.`,
          code: "MONTHLY_LIMIT_REACHED",
          usage: subscription.monthlyUsage,
          limit: MONTHLY_VISION_LIMIT
        }, { status: 429 });
      }
    }

    // Read API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment");
      return NextResponse.json(
        { error: "API key not configured. Please add GEMINI_API_KEY to Vercel environment variables." },
        { status: 500 }
      );
    }
    // API key verified

    // Step 1: Use Gemini to understand the request and enhance the prompt
    const geminiUrl = `${GEMINI_BASE_URL}/${AI_MODELS.VISION_PRO}:generateContent?key=${apiKey}`;
    
    // Extract base64 data if it's a data URL
    let imageBase64 = image;
    let mimeType = "image/jpeg";
    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      }
    }

    const geminiPayload = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          },
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

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${geminiResponse.status}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Step 2: Calculate cost estimate from the analysis
    const costEstimate = calculateCosts(analysisText + " " + description);

    // Step 3: Edit image with Nano Banana Pro
    const nanoBananaUrl = `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${apiKey}`;
    
    // Edit prompt
    const editPrompt = `Edit this room image: ${description}`;

    // Send image + text to Nano Banana
    const editPayload = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          },
          { text: editPrompt }
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    };

    let generatedImage: string | null = null;
    
    try {
      const editResponse = await fetch(nanoBananaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPayload)
      });

      if (editResponse.ok) {
        const editData = await editResponse.json();
        
        const candidate = editData.candidates?.[0];
        const finishReason = candidate?.finishReason;
        
        // Check if model refused to process the image
        if (finishReason === "OTHER" || finishReason === "SAFETY") {
          return NextResponse.json({
            success: false,
            error: "IMAGE_NOT_SUPPORTED",
            message: "לא ניתן לעבד את התמונה הזו. נסה להעלות תמונה אחרת של החדר.",
            analysis: analysisText,
            costs: costEstimate
          });
        }
        
        // Look for image in response parts
        const parts = candidate?.content?.parts || [];
        
        for (const part of parts) {
          // Try all possible formats
          if (part.inlineData?.mimeType?.startsWith("image/")) {
            generatedImage = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          } else if (part.inline_data?.mime_type?.startsWith("image/")) {
            generatedImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
        }
        
        // If no image was found in parts
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
        console.error("Nano Banana error:", editResponse.status, errorText);
        return NextResponse.json({
          success: false,
          error: "API_ERROR",
          message: "שגיאה בעיבוד התמונה. נסה שוב.",
          analysis: analysisText,
          costs: costEstimate
        });
      }
    } catch (editError) {
      console.error("Image edit failed:", editError);
      return NextResponse.json({
        success: false,
        error: "IMAGE_NOT_SUPPORTED",
        message: "לא ניתן לעבד את התמונה הזו. נסה להעלות תמונה אחרת של החדר.",
        analysis: analysisText,
        costs: costEstimate
      });
    }

    // Step 4: Increment usage counter (for subscribed users, not trial)
    if (userEmail && subscription.trialUsed) {
      await incrementUsage(userEmail);
    }

    // Step 5: Return the results (only if we have a generated image)
    return NextResponse.json({
      success: true,
      analysis: analysisText,
      generatedImage: generatedImage,
      costs: costEstimate,
      prompt: editPrompt,
      description: description,
      usage: subscription.trialUsed ? subscription.monthlyUsage + 1 : 0,
      limit: MONTHLY_VISION_LIMIT
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Visualize API error:", errorMessage, error);
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
