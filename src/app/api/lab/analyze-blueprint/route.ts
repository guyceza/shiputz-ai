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

    const prompt = `Analyze this architectural floor plan. Extract all rooms with their dimensions.

Return ONLY valid JSON (no markdown, no explanation):
{
  "rooms": [
    {"id": "room1", "name": "Living Room", "type": "living", "width": 4.5, "length": 6.0, "position": {"x": 0, "y": 0}},
    {"id": "room2", "name": "Kitchen", "type": "kitchen", "width": 3.0, "length": 4.0, "position": {"x": 4.5, "y": 0}}
  ],
  "totalArea": 85
}

Room types: living, kitchen, bedroom, bathroom, hallway, balcony, storage, office
Position: x,y coordinates where the room starts (in meters)
Estimate dimensions in meters if not written.

If this is not a floor plan, return: {"error": "Not a floor plan"}`;

    // Use TEXT_FAST model (has vision capability)
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
          responseMimeType: "application/json",
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
