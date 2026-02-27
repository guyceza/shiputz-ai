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

    const prompt = `אתה מומחה לקריאת תוכניות אדריכליות. נתח את התוכנית ויצור מודל תלת-ממדי.

**מערכת הצירים:**
- X = ציר אופקי (שמאל לימין), מתחיל מ-0
- Y = ציר אנכי (מלמטה למעלה), מתחיל מ-0
- החדר השמאלי-תחתון ביותר מתחיל ב-(0,0)
- חדרים צמודים צריכים לשתף קואורדינטות (אם חדר A נגמר ב-x=5, חדר B מתחיל ב-x=5)

**כללים חשובים:**
1. מדוד מידות במטרים - אם לא כתוב, הערך לפי יחסים
2. כל חדר חייב position עם x,y שמתחברים לשכנים
3. דלתות: ציין על איזה קיר (front/back/left/right) ואיפה (0-1)
4. חדרים חייבים להתחבר - אם סלון מימין למטבח, הם חולקים קיר

**פורמט תגובה (JSON בלבד, בלי markdown):**
{
  "rooms": [
    {
      "id": "living",
      "name": "סלון", 
      "type": "living",
      "width": 5,
      "length": 4,
      "position": {"x": 0, "y": 0},
      "doors": [{"wall": "right", "position": 0.5}],
      "windows": [{"wall": "front", "position": 0.5, "width": 1.5}]
    },
    {
      "id": "kitchen",
      "name": "מטבח",
      "type": "kitchen", 
      "width": 3,
      "length": 4,
      "position": {"x": 5, "y": 0},
      "doors": [{"wall": "left", "position": 0.5}],
      "windows": []
    }
  ],
  "totalArea": 32
}

**בדוגמה למעלה:** סלון (5x4) נמצא ב-(0,0), מטבח (3x4) נמצא ב-(5,0) - הם צמודים כי סלון נגמר ב-x=5 ומטבח מתחיל ב-x=5.

**סוגי חדרים:** living, kitchen, bedroom, bathroom, hallway, balcony, storage, office

**קירות:** front (y מינימלי), back (y מקסימלי), left (x מינימלי), right (x מקסימלי)

נתח את התוכנית והחזר JSON בלבד:`;

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
