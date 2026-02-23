export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from '@/lib/supabase';
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";

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
    const { image, userEmail } = body;

    // Auth check - verify user exists and has premium
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
        error: "Shop The Look זמין למנויי פרימיום בלבד. שדרגו את החשבון שלכם." 
      }, { status: 403 });
    }

    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

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

    // Use Gemini to detect products in the image
    const geminiUrl = `${GEMINI_BASE_URL}/${AI_MODELS.VISION_PRO}:generateContent?key=${apiKey}`;
    
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
            text: `Analyze this interior room image and identify all furniture and decor items that can be purchased.

For each item, provide:
1. name (Hebrew name)
2. position as percentages from top-left (top, left, width, height)
3. searchQuery (Hebrew search query to find this product)

Return a JSON array with this exact format:
[
  {
    "id": "unique-id",
    "name": "שם בעברית",
    "position": { "top": 30, "left": 20, "width": 25, "height": 40 },
    "searchQuery": "מילות חיפוש בעברית"
  }
]

Identify 5-10 main items. Be precise with positions. Return ONLY the JSON array, no other text.`
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
      console.error("Gemini API error:", geminiResponse.status);
      return NextResponse.json({ items: [] });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ items });
      }
    } catch (parseError) {
      console.error("Failed to parse product detection response:", parseError);
    }

    return NextResponse.json({ items: [] });

  } catch (error) {
    console.error("Product detection error:", error);
    return NextResponse.json({ items: [] });
  }
}
