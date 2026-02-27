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

    const prompt = `אתה מומחה לקריאת תוכניות אדריכליות. נתח את התוכנית וחלץ מידע מפורט על כל החדרים.

**חשוב מאוד:**
- חלץ את כל החדרים שאתה רואה בתוכנית
- הערך מידות במטרים (אם לא כתוב, הערך לפי פרופורציות)
- ציין איפה כל חדר נמצא ביחס לאחרים
- ציין איפה יש דלתות/מעברים בין חדרים

החזר JSON בפורמט הבא בלבד (ללא markdown):
{
  "rooms": [
    {
      "id": "living",
      "name": "סלון",
      "type": "living",
      "width": 4.5,
      "length": 6.0,
      "position": {"x": 0, "y": 0},
      "doors": [
        {"to": "kitchen", "wall": "right", "position": 0.5},
        {"to": "hallway", "wall": "back", "position": 0.3}
      ],
      "windows": [{"wall": "front", "position": 0.5, "width": 1.5}],
      "features": ["מרפסת"]
    },
    {
      "id": "kitchen",
      "name": "מטבח",
      "type": "kitchen",
      "width": 3.0,
      "length": 4.0,
      "position": {"x": 4.5, "y": 0},
      "doors": [{"to": "living", "wall": "left", "position": 0.5}],
      "windows": [{"wall": "front", "position": 0.5, "width": 1.0}],
      "features": []
    }
  ],
  "totalArea": 85,
  "floors": 1,
  "style": "מודרני",
  "notes": "דירת 3 חדרים"
}

**סוגי חדרים (type):** living, kitchen, bedroom, bathroom, hallway, balcony, storage, office

**קירות (wall):** front (קדמי/דרום), back (אחורי/צפון), left (שמאל/מערב), right (ימין/מזרח)

**position:** מיקום הדלת/חלון על הקיר (0=התחלה, 0.5=אמצע, 1=סוף)

אם זו לא תוכנית אדריכלית, החזר: {"error": "זו לא תוכנית אדריכלית"}`;

    const response = await fetch(`${getGeminiUrl("TEXT_FAST")}?key=${apiKey}`, {
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
      let cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      
      // Try to extract JSON object if there's extra text
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }
      
      const analysis: BlueprintAnalysis = JSON.parse(cleanJson);
      
      if ("error" in analysis) {
        return NextResponse.json({ error: analysis.error }, { status: 400 });
      }

      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      // Return a more helpful error with a snippet of the response
      return NextResponse.json(
        { 
          error: "Failed to parse blueprint analysis",
          debug: text?.substring(0, 200) 
        },
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
