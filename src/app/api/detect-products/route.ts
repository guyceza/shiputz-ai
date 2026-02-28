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
      console.log("[detect-products] Fetching image from URL:", image.substring(0, 100));
      try {
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          console.error("[detect-products] Failed to fetch image:", imageResponse.status);
          return NextResponse.json({ items: [], error: "Failed to fetch image" });
        }
        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
        mimeType = contentType.split(";")[0];
        const arrayBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
        console.log("[detect-products] Fetched image, size:", imageBase64.length);
      } catch (fetchError) {
        console.error("[detect-products] Error fetching image:", fetchError);
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

    console.log("[detect-products] Calling Gemini API...");
    console.log("[detect-products] Image length:", imageBase64?.length || 0);
    
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("[detect-products] Gemini API error:", geminiResponse.status, errorText);
      return NextResponse.json({ items: [], error: `Gemini error: ${geminiResponse.status}` });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("[detect-products] Gemini response text:", responseText.substring(0, 500));
    
    // Parse JSON from response
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const items = JSON.parse(jsonMatch[0]);
        console.log("[detect-products] Parsed items:", items.length);
        return NextResponse.json({ items });
      } else {
        console.log("[detect-products] No JSON array found in response");
      }
    } catch (parseError) {
      console.error("[detect-products] Failed to parse product detection response:", parseError);
    }

    return NextResponse.json({ items: [], debug: "no_items_parsed", responsePreview: responseText.substring(0, 200) });

  } catch (error) {
    console.error("Product detection error:", error);
    return NextResponse.json({ items: [], error: String(error) });
  }
}
