export const runtime = "nodejs";
export const maxDuration = 30;

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Verify user is authenticated
async function verifyAuth(request: NextRequest): Promise<boolean> {
  try {
    const authCookie = request.cookies.get('sb-vghfcdtzywbmlacltnjp-auth-token');
    if (authCookie) return true;
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const isAuthenticated = await verifyAuth(request);
    if (!isAuthenticated) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }

    // Rate limiting - 20 requests per minute
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 20, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: "יותר מדי בקשות. נסה שוב בעוד דקה." 
      }, { status: 429 });
    }

    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    
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
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

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
