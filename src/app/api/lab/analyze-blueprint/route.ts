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

    const prompt = `נתח תוכנית אדריכלית. פעל בשלבים:

**שלב 1 - תאר מה אתה רואה:**
ציין כל אזור בתמונה: מיקום יחסי (שמאל/ימין/למעלה/למטה), מה יש בו (רהיטים/אלמנטים), מידות אם רשומות.

**שלב 2 - צייר רשת:**
חלק את הדירה לשורות ועמודות:
- שורה תחתונה (y=0): אילו חדרים?
- שורה עליונה (y גבוה): אילו חדרים?
- לכל חדר: רוחב (x), גובה (y), נקודת התחלה

**שלב 3 - וודא חיבורים:**
- כל שני חדרים צמודים חולקים קיר (קואורדינטות זהות בגבול)
- אין חפיפה בין חדרים
- מרפסת: x שלילי אם משמאל לדירה

**שלב 4 - בנה JSON:**
לכל חדר:
- width = רוחב (ציר X)
- length = אורך (ציר Y) 
- position.x = התחלה אופקית
- position.y = התחלה אנכית
- doors: רק בצד אחד של קיר משותף

**זיהוי:**
- מטבח: משטח עבודה/כיריים/כיור מטבח (גם קיטשנט קטן)
- חדר רחצה: אסלה + אמבט/מקלחון + כיור
- סלון: ספה, שולחן, טלוויזיה
- חדר שינה: מיטה
- מרפסת: קו מקווקו, טקסט "מרפסת"

**מידות:** מספרים בתמונה בס"מ (645=6.45מ'). אין מידות? דלת=0.9מ', אסלה=0.6מ'.

**סוגים:** living, kitchen, bedroom, bathroom, hallway, balcony, storage, office

**פורמט סופי (JSON בלבד, בלי הסברים):**
{
  "rooms": [
    {"id": "bathroom", "name": "שם", "type": "סוג", "width": X, "length": Y, "position": {"x": 0, "y": 0}, "doors": [{"wall": "right", "position": 0.5}], "windows": []}
  ],
  "totalArea": סה"כ
}

נתח והחזר JSON:`;

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
