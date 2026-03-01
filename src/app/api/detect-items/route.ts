export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

// Bug #21 fix: Removed unused GEMINI_BASE_URL import
import { AI_MODELS } from "@/lib/ai-config";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: "Image upload required (multipart/form-data)" }, { status: 400 });
    }
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const userEmail = formData.get("userEmail") as string;

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
        error: "זיהוי פריטים זמין למנויי פרימיום בלבד. שדרגו את החשבון שלכם." 
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
    
    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type;

    // Use Gemini Vision to detect items
    // Using IMAGE_GEN instead of VISION_PRO to avoid March 9 deprecation
    const model = genAI.getGenerativeModel({ model: AI_MODELS.IMAGE_GEN });

    const prompt = `אתה מומחה לזיהוי רהיטים ופריטי עיצוב בתמונות.

נתח את התמונה וזהה את הפריטים הבאים:
- רהיטים (ספות, כורסאות, שולחנות, ארונות, מזנונים)
- תאורה (מנורות רצפה, מנורות שולחן, נברשות)
- צמחים ועציצים
- פריטי דקורציה בולטים
- סוג הריצוף/פרקט

עבור כל פריט החזר:
1. name - שם הפריט בעברית
2. position - מיקום משוער באחוזים מהתמונה:
   - top: אחוז מהחלק העליון
   - left: אחוז מהצד הימני
   - width: רוחב הפריט באחוזים
   - height: גובה הפריט באחוזים
3. searchQuery - שאילתת חיפוש בעברית לקנייה בישראל

החזר את התשובה בפורמט JSON בלבד, ללא טקסט נוסף:
{
  "items": [
    {
      "id": "item-1",
      "name": "שם הפריט",
      "position": {"top": 50, "left": 30, "width": 25, "height": 20},
      "searchQuery": "שאילתת חיפוש לקנייה"
    }
  ]
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      { text: prompt },
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ items: [] });
    }
    
    try {
      const parsedResponse = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsedResponse);
    } catch {
      return NextResponse.json({ items: [] });
    }
  } catch (error) {
    console.error("Error detecting items:", error);
    return NextResponse.json(
      { error: "Failed to detect items" },
      { status: 500 }
    );
  }
}
