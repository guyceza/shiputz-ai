export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

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
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${apiKey}`;
    
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
