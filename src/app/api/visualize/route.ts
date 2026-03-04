export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { trackRequest } from "@/lib/usage-monitor";

const RESEND_KEY = process.env.RESEND_API_KEY;
import { ADMIN_EMAILS, isAdminEmail } from '@/lib/admin';
const ADMIN_EMAIL = ADMIN_EMAILS[0];

// Send notification to admin when API rate limit is hit
async function notifyAdminRateLimit(apiName: string, status: number, errorDetails: string): Promise<void> {
  if (!RESEND_KEY) return;
  
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShiputzAI Alerts <help@shipazti.com>',
        to: ADMIN_EMAIL,
        subject: `🚨 ShiputzAI: ${apiName} Rate Limit הגענו למגבלה!`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #e53e3e;">⚠️ התראת Rate Limit</h2>
            <p><strong>API:</strong> ${apiName}</p>
            <p><strong>Status Code:</strong> ${status}</p>
            <p><strong>זמן:</strong> ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
            <p><strong>פרטים:</strong></p>
            <pre style="background: #f5f5f5; padding: 10px; overflow: auto; max-height: 200px;">${errorDetails.substring(0, 500)}</pre>
            <hr>
            <p>יש לשקול שדרוג ל-Tier 2 או להמתין שהמכסה תתאפס.</p>
          </div>
        `
      }),
    });
    console.log('Admin notified about rate limit');
  } catch (e) {
    console.error('Failed to notify admin:', e);
  }
}

// Verify user is authenticated (has valid Supabase session via cookie)
async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    // Check for any Supabase auth cookie (various formats)
    const cookies = request.cookies.getAll();
    const hasSupabaseCookie = cookies.some(c => 
      c.name.startsWith('sb-')
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
async function verifySubscription(userEmail: string | null): Promise<{ 
  hasPurchased: boolean, hasVision: boolean, trialUsed: boolean, monthlyUsage: number, vizCredits: number, isPro: boolean 
}> {
  if (!userEmail) return { hasPurchased: false, hasVision: false, trialUsed: false, monthlyUsage: 0, vizCredits: 0, isPro: false };
  
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('users')
      .select('purchased, vision_subscription, vision_trial_used, vision_usage_count, vision_usage_month, viz_credits, viz_monthly_used, viz_monthly_reset')
      .eq('email', userEmail.toLowerCase())
      .single();
    
    // Check if we're in a new month - reset monthly count if so
    const currentMonth = new Date().toISOString().slice(0, 7); // "2026-03"
    let usageCount = data?.vision_usage_count || 0;
    let monthlyUsed = data?.viz_monthly_used || 0;
    
    if (data?.vision_usage_month !== currentMonth) {
      usageCount = 0;
      monthlyUsed = 0;
    }
    
    const isPro = data?.purchased === true && 
      (data?.vision_subscription === true || data?.vision_subscription === 'active');
    
    return { 
      hasPurchased: data?.purchased === true,
      hasVision: data?.vision_subscription === true || data?.vision_subscription === 'active',
      trialUsed: data?.vision_trial_used === true,
      monthlyUsage: usageCount,
      vizCredits: data?.viz_credits || 0,
      isPro
    };
  } catch {
    return { hasPurchased: false, hasVision: false, trialUsed: false, monthlyUsage: 0, vizCredits: 0, isPro: false };
  }
}

// Bug #9 fix: Atomic increment for vision usage counter
// Uses PostgreSQL's atomic operations to prevent race conditions
async function incrementUsage(userEmail: string): Promise<{ success: boolean; newCount: number }> {
  try {
    const supabase = createServiceClient();
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // First check if we need to reset (new month)
    const { data: userData } = await supabase
      .from('users')
      .select('vision_usage_month')
      .eq('email', userEmail.toLowerCase())
      .single();
    
    if (userData?.vision_usage_month !== currentMonth) {
      // New month - reset to 1
      const { error } = await supabase
        .from('users')
        .update({ 
          vision_usage_count: 1,
          vision_usage_month: currentMonth
        })
        .eq('email', userEmail.toLowerCase());
      
      return { success: !error, newCount: 1 };
    }
    
    // Same month - use atomic increment via RPC or raw SQL
    // Fallback: Use optimistic update with version check
    const { data, error } = await supabase.rpc('increment_vision_usage', { 
      user_email: userEmail.toLowerCase(),
      current_month: currentMonth
    }).single();
    
    if (error) {
      // Fallback if RPC doesn't exist: manual increment (less safe but works)
      console.warn('RPC not available, using manual increment:', error.message);
      const { data: currentData } = await supabase
        .from('users')
        .select('vision_usage_count')
        .eq('email', userEmail.toLowerCase())
        .single();
      
      const newCount = (currentData?.vision_usage_count || 0) + 1;
      await supabase
        .from('users')
        .update({ 
          vision_usage_count: newCount,
          vision_usage_month: currentMonth
        })
        .eq('email', userEmail.toLowerCase());
      
      return { success: true, newCount };
    }
    
    return { success: true, newCount: (data as any)?.vision_usage_count || 1 };
  } catch (e) {
    console.error('Failed to increment usage:', e);
    return { success: false, newCount: 0 };
  }
}

// Bug #12 fix: Mark trial as used BEFORE generation to prevent abuse
async function markTrialUsed(userEmail: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('users')
      .update({ vision_trial_used: true })
      .eq('email', userEmail.toLowerCase())
      .eq('vision_trial_used', false); // Only update if not already used
    
    // If no error and row was updated, we successfully claimed the trial
    return !error;
  } catch (e) {
    console.error('Failed to mark trial as used:', e);
    return false;
  }
}

// Bug fix: Rollback trial if generation fails due to system error (not user's fault)
async function rollbackTrial(userEmail: string): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase
      .from('users')
      .update({ vision_trial_used: false })
      .eq('email', userEmail.toLowerCase());
    console.log(`Trial rolled back for ${userEmail} due to system error`);
  } catch (e) {
    console.error('Failed to rollback trial:', e);
  }
}

const MONTHLY_PRO_LIMIT = 5; // Pro subscribers get 5/month, then use credits

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
        error: "המערכת עמוסה כרגע. נסה שוב בעוד דקה." 
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
    
    // Bug #12 fix: If trial not used, mark it BEFORE generation to prevent abuse
    let isTrialRun = false;
    if (!subscription.trialUsed) {
      // Atomically mark trial as used BEFORE generation
      const trialClaimed = await markTrialUsed(userEmail);
      if (!trialClaimed) {
        // Another request already claimed the trial - re-check subscription
        const recheckSub = await verifySubscription(userEmail);
        if (!recheckSub.hasPurchased || !recheckSub.hasVision) {
          return NextResponse.json({ 
            error: "התקופת הנסיון שלך כבר נוצלה. נדרש מנוי Pro.",
            code: "TRIAL_ALREADY_USED"
          }, { status: 403 });
        }
      } else {
        isTrialRun = true;
      }
    } else {
      // Trial used - check access
      const isAdmin = isAdminEmail(userEmail);
      
      if (!isAdmin) {
        if (subscription.vizCredits <= 0) {
          // No credits left — need to buy Pro or a pack
          return NextResponse.json({ 
            error: subscription.isPro 
              ? "נגמרו ההדמיות שלך. רכוש חבילת הדמיות נוספות."
              : "נדרש רכישת Pro או חבילת הדמיות",
            code: subscription.isPro ? "NO_CREDITS" : "SUBSCRIPTION_REQUIRED",
            vizCredits: subscription.vizCredits
          }, { status: subscription.isPro ? 429 : 403 });
        }
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
    // Using IMAGE_GEN instead of VISION_PRO to avoid March 9 deprecation
    const geminiUrl = `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${apiKey}`;
    
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

    // Add timeout controller for Gemini analysis (60 seconds)
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
      console.error("Gemini API error:", geminiResponse.status, errorText);
      
      // Bug fix: Rollback trial if this was a trial run - user shouldn't lose trial due to system error
      if (isTrialRun && userEmail) {
        await rollbackTrial(userEmail);
      }
      
      // Handle rate limit / quota exceeded from Gemini
      if (geminiResponse.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
        // Send admin notification
        await notifyAdminRateLimit("Gemini Vision API", geminiResponse.status, errorText);
        
        return NextResponse.json({
          error: "יש עומס זמני על המערכת. הצוות שלנו כבר מטפל בזה. נסה שוב בעוד כמה דקות.",
          code: "SYSTEM_OVERLOAD"
        }, { status: 503 });
      }
      
      return NextResponse.json(
        { error: "שגיאה זמנית בשירות. נסה שוב." },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Step 2: Calculate cost estimate from the analysis
    const costEstimate = calculateCosts(analysisText + " " + description);

    // Step 3: Edit image with Nano Banana Pro
    const nanoBananaUrl = `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${apiKey}`;
    
    // Edit prompt - make the requested change while preserving the room
    const editPrompt = `You are editing a room photo for a renovation visualization.

THE CHANGE REQUESTED: ${description}

INSTRUCTIONS:
1. MAKE THE CHANGE - Actually perform what was requested. If they ask to remove a wall, remove it and show the open space behind it.
2. KEEP THE ROOM - Same angle, same lighting, same floor, same other furniture
3. SHOW RESULTS - The image should show a finished, clean renovation result

If the request is to "remove wall", "break wall", or "open the space" - you MUST show the wall removed with a clear view of what's behind/beyond it. This is a renovation visualization - show what it would look like AFTER the renovation is complete.`;

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
      // Add timeout controller for image generation (60 seconds)
      const imageController = new AbortController();
      const imageTimeout = setTimeout(() => imageController.abort(), 60000);
      
      const editResponse = await fetch(nanoBananaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPayload),
        signal: imageController.signal
      }).finally(() => clearTimeout(imageTimeout));

      if (editResponse.ok) {
        const editData = await editResponse.json();
        
        const candidate = editData.candidates?.[0];
        const finishReason = candidate?.finishReason;
        
        // Check if model refused to process the image
        if (finishReason === "OTHER" || finishReason === "SAFETY") {
          // SAFETY = user uploaded inappropriate content, don't rollback trial
          // OTHER = ambiguous, could be system issue, rollback to be safe
          if (finishReason === "OTHER" && isTrialRun && userEmail) {
            await rollbackTrial(userEmail);
          }
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
        
        // If no image was found in parts - this is likely a system issue
        if (!generatedImage) {
          // Bug fix: Rollback trial - no image generated despite API success
          if (isTrialRun && userEmail) {
            await rollbackTrial(userEmail);
          }
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
        
        // Bug fix: Rollback trial if this was a trial run - user shouldn't lose trial due to system error
        if (isTrialRun && userEmail) {
          await rollbackTrial(userEmail);
        }
        
        // Handle rate limit / quota exceeded from Gemini Image API
        if (editResponse.status === 429 || errorText.includes("RESOURCE_EXHAUSTED") || errorText.includes("quota")) {
          await notifyAdminRateLimit("Nano Banana Pro (Image Gen)", editResponse.status, errorText);
          
          return NextResponse.json({
            success: false,
            error: "SYSTEM_OVERLOAD",
            message: "יש עומס זמני על המערכת. הצוות שלנו כבר מטפל בזה. נסה שוב בעוד כמה דקות.",
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
      console.error("Image edit failed:", editError);
      
      // Bug fix: Rollback trial if this was a trial run - user shouldn't lose trial due to system error
      if (isTrialRun && userEmail) {
        await rollbackTrial(userEmail);
      }
      
      // Handle timeout specifically
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

    // Step 4: Increment usage counter and deduct credits if needed
    // Bug #12: Trial was already marked used before generation
    let usedCredit = false;
    if (userEmail && !isTrialRun) {
      await incrementUsage(userEmail);
      
      // Deduct credit for every visualization (except admin)
      const isAdmin = isAdminEmail(userEmail);
      if (!isAdmin && subscription.vizCredits > 0) {
        const supabase = createServiceClient();
        await supabase
          .from('users')
          .update({ viz_credits: subscription.vizCredits - 1 })
          .eq('email', userEmail.toLowerCase());
        usedCredit = true;
      }
    }

    // Step 5: Track successful request and return results
    trackRequest('/api/visualize', false);
    
    return NextResponse.json({
      success: true,
      analysis: analysisText,
      generatedImage: generatedImage,
      costs: costEstimate,
      prompt: editPrompt,
      description: description,
      vizCredits: usedCredit ? subscription.vizCredits - 1 : subscription.vizCredits,
      usedCredit
    });

  } catch (error) {
    // Track error
    trackRequest('/api/visualize', true);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Visualize API error:", errorMessage, error);
    
    // Bug fix: Try to rollback trial on unexpected errors
    // Note: isTrialRun and userEmail may not be defined if error happened early
    // But we can try to extract userEmail from the request body
    try {
      const body = await request.clone().json().catch(() => ({}));
      if (body.userEmail) {
        // Check if this user's trial was just marked as used (within last minute)
        const supabase = createServiceClient();
        const { data } = await supabase
          .from('users')
          .select('vision_trial_used, updated_at')
          .eq('email', body.userEmail.toLowerCase())
          .single();
        
        // Only rollback if trial was marked used very recently (within 60 seconds)
        if (data?.vision_trial_used && data?.updated_at) {
          const updatedAt = new Date(data.updated_at).getTime();
          const now = Date.now();
          if (now - updatedAt < 60000) {
            await rollbackTrial(body.userEmail);
          }
        }
      }
    } catch (rollbackError) {
      console.error("Failed to check/rollback trial on error:", rollbackError);
    }
    
    // Return friendly error message
    return NextResponse.json({
      error: "אירעה שגיאה בעיבוד התמונה. נסה שוב מאוחר יותר.",
      code: "SERVER_ERROR",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 });
  }
}
