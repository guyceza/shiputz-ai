import { NextRequest, NextResponse } from "next/server";
import { getGeminiUrl } from "@/lib/ai-config";

export const runtime = "nodejs";
export const maxDuration = 30;

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

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

    const prompt = `נתח תוכנית אדריכלית והחזר JSON.

**כללים:**
1. position ייחודי לכל חדר
2. חדרים צמודים חולקים גבול (אם A נגמר ב-x=2.45, B מתחיל ב-x=2.45)
3. מידות בס"מ→מ': 645=6.45מ'

**בדוק פערים!**
אם יש רווח בין חדרים (למשל חדר נגמר ב-x=2.45, הבא מתחיל ב-x=3.85):
- יש שם חדר נוסף! (שירות/כביסה/מטבחון)
- הרוחב = 3.85-2.45 = 1.4מ'

**מרפסת:**
קו מקווקו (---) = מרפסת. 
- אם המרפסת משמאל לחדר הראשי: position.x = מינוס רוחב המרפסת
- אם ברוחב 1.2מ' משמאל, אז x = -1.2 (לא 0!)

**זיהוי:**
- חדר רחצה: אסלה + אמבט
- שירות: מכונת כביסה, כיור בודד
- מטבחון: כיריים או משטח עבודה ארוך
- מדרגות: type:"hallway"

**wall:** front=y נמוך, back=y גבוה, left=x נמוך, right=x גבוה

**דוגמה:**
{
  "rooms": [
    {"id": "bathroom", "name": "חדר רחצה", "type": "bathroom", "width": 2.45, "length": 1.3, "position": {"x": 0, "y": 0}, "doors": [{"wall": "back", "position": 0.5}], "windows": []},
    {"id": "utility", "name": "שירות", "type": "storage", "width": 1.4, "length": 1.5, "position": {"x": 2.45, "y": 0}, "doors": [], "windows": []},
    {"id": "stairs", "name": "מדרגות", "type": "hallway", "width": 2.6, "length": 2.5, "position": {"x": 3.85, "y": 0}, "doors": [], "windows": []},
    {"id": "living", "name": "סלון ושינה", "type": "living", "width": 6.45, "length": 5, "position": {"x": 0, "y": 1.3}, "doors": [{"wall": "front", "position": 0.4}, {"wall": "left", "position": 0.7}], "windows": []},
    {"id": "balcony", "name": "מרפסת", "type": "balcony", "width": 1.2, "length": 2.5, "position": {"x": -1.2, "y": 2.5}, "doors": [], "windows": []}
  ],
  "totalArea": 40
}

שים לב: המרפסת ב-x=-1.2 כי היא משמאל לדירה!

החזר JSON:`;

    const response = await fetch(`${getGeminiUrl("IMAGE_GEN")}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
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

    try {
      let cleanJson = text.replace(/```json\n?|\n?```/g, "").trim();
      const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanJson = jsonMatch[0];
      }
      
      const analysis = JSON.parse(cleanJson);
      
      if ("error" in analysis) {
        return NextResponse.json({ error: analysis.error }, { status: 400 });
      }

      // Validate and fix room connections
      if (analysis.rooms && analysis.rooms.length > 0) {
        analysis.rooms = validateRoomPositions(analysis.rooms);
      }

      console.log("Blueprint analysis:", JSON.stringify(analysis, null, 2));
      return NextResponse.json(analysis);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return NextResponse.json(
        { error: "Failed to parse blueprint analysis", debug: text?.substring(0, 500) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Blueprint analysis error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Validate and fix room positions to ensure they connect properly
function validateRoomPositions(rooms: any[]): any[] {
  if (rooms.length <= 1) return rooms;
  
  // Sort rooms by position (left-to-right, bottom-to-top)
  rooms.sort((a, b) => {
    const posA = a.position || { x: 0, y: 0 };
    const posB = b.position || { x: 0, y: 0 };
    if (posA.y !== posB.y) return posA.y - posB.y;
    return posA.x - posB.x;
  });
  
  // Ensure first room starts at (0,0)
  const firstPos = rooms[0].position || { x: 0, y: 0 };
  const offsetX = firstPos.x;
  const offsetY = firstPos.y;
  
  rooms.forEach(room => {
    if (!room.position) room.position = { x: 0, y: 0 };
    room.position.x -= offsetX;
    room.position.y -= offsetY;
    
    // Ensure positive coordinates
    room.position.x = Math.max(0, room.position.x);
    room.position.y = Math.max(0, room.position.y);
    
    // Default dimensions if missing
    if (!room.width || room.width <= 0) room.width = 3;
    if (!room.length || room.length <= 0) room.length = 3;
    
    // Ensure doors array exists
    if (!room.doors) room.doors = [];
    if (!room.windows) room.windows = [];
  });
  
  return rooms;
}
