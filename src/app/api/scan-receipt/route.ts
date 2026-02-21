export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY || ANTHROPIC_API_KEY === "placeholder") {
      // Demo mode - return mock data
      return NextResponse.json({
        description: "קבלה לדוגמה",
        amount: Math.floor(Math.random() * 1000) + 100,
        category: "חומרי בניין",
      });
    }

    // Extract base64 data
    const base64Data = image.split(",")[1] || image;
    const mediaType = image.includes("image/png") ? "image/png" : "image/jpeg";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64Data,
                },
              },
              {
                type: "text",
                text: `אתה מנתח קבלות וחשבוניות בעברית. נתח את התמונה והחזר JSON בפורמט הבא בלבד (ללא טקסט נוסף):
{
  "description": "תיאור קצר של הקבלה/העסקה",
  "amount": מספר (הסכום הסופי לתשלום),
  "category": "אחת מהקטגוריות: חומרי בניין, עבודה, חשמל, אינסטלציה, ריצוף, צבע, מטבח, אמבטיה, אחר"
}

אם לא ניתן לזהות - החזר null לשדה הרלוונטי.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Claude API error:", error);
      return NextResponse.json({ error: "AI scan failed" }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse JSON from response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
      }
    } catch {
      console.error("Failed to parse AI response:", content);
    }

    return NextResponse.json({ error: "Could not parse receipt" }, { status: 422 });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
