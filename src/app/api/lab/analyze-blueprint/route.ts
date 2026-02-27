import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, getGeminiUrl } from "@/lib/ai-config";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Room {
  name: string;
  width: number;
  length: number;
  height?: number;
  features?: string[];
}

interface BlueprintAnalysis {
  rooms: Room[];
  totalArea: number;
  style?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

    const prompt = `אתה מומחה לקריאת תוכניות אדריכליות. נתח את התוכנית הבאה וחלץ את המידע הבא:

1. רשימת החדרים עם מידות (אורך x רוחב במטרים)
2. שטח כולל משוער
3. פיצ'רים מיוחדים (חלונות, דלתות, מרפסת וכו')

החזר JSON בפורמט הבא בלבד (ללא markdown):
{
  "rooms": [
    {"name": "סלון", "width": 4.5, "length": 6.0, "features": ["חלון גדול", "דלת למרפסת"]},
    {"name": "חדר שינה", "width": 3.5, "length": 4.0, "features": ["חלון"]}
  ],
  "totalArea": 85,
  "style": "מודרני",
  "notes": "דירה עם מרפסת שמש"
}

אם אתה לא יכול לקרוא מידות מדויקות, תן הערכה סבירה.
אם זו לא תוכנית אדריכלית, החזר: {"error": "זו לא תוכנית אדריכלית"}`;

    const response = await fetch(getGeminiUrl("TEXT_FAST"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({ error: "Failed to analyze blueprint" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    try {
      // Remove markdown code blocks if present
      const cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const analysis: BlueprintAnalysis = JSON.parse(cleanJson);
      
      if ("error" in analysis) {
        return NextResponse.json({ error: analysis.error }, { status: 400 });
      }

      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to parse blueprint analysis" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Blueprint analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
