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

    const prompt = `נתח תוכנית אדריכלית והחזר JSON מדויק למודל 3D.

**קריאת מידות:**
- מספרים בתמונה בד"כ בס"מ (645 = 6.45 מטר)
- אם אין, הערך לפי דלת=0.9מ', אסלה=0.6מ'

**זיהוי חדרים - חפש:**
- מטבח: משטח עבודה ארוך, כיור, כיריים (גם "קיטשנט" או פינת בישול)
- חדר רחצה: אסלה + אמבט/מקלחון
- סלון: ספות, שולחן קפה
- חדר שינה: מיטה
- מרפסת: קו מקווקו בתוכנית, בד"כ צמודה לסלון
- מסדרון/מדרגות: מדרגות מצוירות

**מערכת צירים (חשוב!):**
- דמיין את התוכנית כרשת
- (0,0) = פינה שמאלית-תחתונה של כל הדירה
- X = אופקי (ימינה חיובי)
- Y = אנכי (למעלה חיובי)
- width = רוחב (מימד X)
- length = אורך (מימד Y)

**חיבור חדרים:**
- חדרים ששוכנים זה ליד זה חייבים לחלוק גבול
- דוגמה: אם מטבח ברוחב 2.5 מתחיל ב-x=0, הסלון שמימינו מתחיל ב-x=2.5

**מרפסת:**
- אם המרפסת משמאל לחדר: position.x שלילי
- אם למעלה: position.y גבוה יותר מהחדר

**דלתות:**
- רשום דלת רק בחדר אחד מתוך שניים צמודים
- wall: front/back/left/right (מנקודת מבט של מי שבתוך החדר)
- position: 0=התחלת הקיר, 0.5=אמצע, 1=סוף

**סוגים:** living, kitchen, bedroom, bathroom, hallway, balcony, storage, office

**JSON בלבד (ללא markdown):**
{
  "rooms": [
    {"id": "bathroom", "name": "חדר רחצה", "type": "bathroom", "width": 2, "length": 2.5, "position": {"x": 0, "y": 0}, "doors": [{"wall": "right", "position": 0.5}], "windows": []},
    {"id": "kitchen", "name": "מטבח", "type": "kitchen", "width": 2, "length": 2.5, "position": {"x": 2, "y": 0}, "doors": [], "windows": []}
  ],
  "totalArea": 35
}`;

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
