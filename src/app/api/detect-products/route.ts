export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from '@/lib/supabase';
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";

// Verify user exists (Shop the Look is part of the visualization experience, including trial)
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
    
    // Shop the Look is part of the visualization experience (including free trial)
    const userExists = await verifyUserExists(userEmail);
    if (!userExists) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }

    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Extract base64 data - handle both data URLs and regular URLs
    let imageBase64 = image;
    let mimeType = "image/jpeg";
    
    if (image.startsWith("data:")) {
      // Data URL - extract base64
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      }
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      // URL - fetch and convert to base64
      try {
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          return NextResponse.json({ items: [], error: "Failed to fetch image" });
        }
        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
        mimeType = contentType.split(";")[0];
        const arrayBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      } catch (fetchError) {
        return NextResponse.json({ items: [], error: "Failed to fetch image" });
      }
    }

    // Use Gemini to detect products in the image
    // Using IMAGE_GEN instead of VISION_PRO to avoid March 9 deprecation
    const geminiUrl = `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${apiKey}`;
    
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
            text: `You are analyzing a room image to identify purchasable furniture and decor items.

CRITICAL: Position values MUST be percentages (0-100), NOT pixels!
- top: percentage from top of image (0 = top edge, 50 = middle, 100 = bottom)
- left: percentage from left of image (0 = left edge, 50 = middle, 100 = right)

For each item found, provide:
1. Hebrew name
2. Position as percentage values
3. Hebrew search query

Return ONLY a JSON array like this (no markdown, no explanation):
[{"id":"1","name":"מיטה","position":{"top":60,"left":40},"searchQuery":"מיטה זוגית"}]

Find 5-8 main furniture/decor items. Position should be the CENTER of each item.`
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
      return NextResponse.json({ items: [] });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response
    try {
      // Clean up response - remove markdown code blocks
      let cleanText = responseText.replace(/```json\n?/g, '').replace(/```/g, '').trim();
      
      // Find the first complete JSON array (handle duplicates)
      const firstArrayEnd = cleanText.indexOf(']') + 1;
      if (firstArrayEnd > 0) {
        const jsonStr = cleanText.substring(0, firstArrayEnd);
        const items = JSON.parse(jsonStr);
        
        // Validate positions are percentages (0-100)
        const validItems = items.filter((item: any) => {
          const pos = item.position;
          return pos && 
                 typeof pos.top === 'number' && pos.top >= 0 && pos.top <= 100 &&
                 typeof pos.left === 'number' && pos.left >= 0 && pos.left <= 100;
        });
        
        return NextResponse.json({ items: validItems });
      }
    } catch (parseError) {
      console.error("[detect-products] Failed to parse product detection response:", parseError);
    }

    return NextResponse.json({ items: [] });

  } catch (error) {
    return NextResponse.json({ items: [] });
  }
}
