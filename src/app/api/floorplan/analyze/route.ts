import { NextRequest, NextResponse } from 'next/server';
import { AI_MODELS, GEMINI_BASE_URL } from '@/lib/ai-config';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert architectural floor plan analyzer. Given an image of a floor plan (hand-drawn, professional, or photographed), extract all structural elements precisely.

Return ONLY valid JSON with this exact structure:
{
  "walls": [
    {"start": [x, y], "end": [x, y], "thickness": 0.15}
  ],
  "rooms": [
    {"name": "Room Name", "polygon": [[x,y], [x,y], ...], "type": "bedroom|bathroom|kitchen|living|hallway|balcony|storage|laundry|entrance"}
  ],
  "doors": [
    {"position": [x, y], "width": 0.9, "rotation": 0}
  ],
  "windows": [
    {"position": [x, y], "width": 1.2}
  ],
  "dimensions": {"width": 10.0, "height": 8.0}
}

RULES:
- All coordinates in METERS, origin at top-left corner
- Walls: each wall is a line segment from start to end. Thickness is typically 0.12-0.20m for interior, 0.20-0.30m for exterior
- Rooms: polygon points define the room boundary, ordered clockwise. Name in the language shown on the plan (Hebrew if Hebrew)
- Doors: position is the center of the door on the wall. Standard width 0.8-0.9m
- Windows: position is center on wall. Standard width 1.0-1.5m
- Dimensions: overall width and height of the floor plan in meters
- If dimensions are shown on the plan, use those exact values
- If no dimensions shown, estimate based on typical room sizes (bedroom ~12sqm, bathroom ~4sqm, kitchen ~10sqm)
- Include ALL walls, including interior partition walls
- Connect walls properly at corners (shared endpoints)
- Room polygons should align with wall positions`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const geminiUrl = `${GEMINI_BASE_URL}/${AI_MODELS.TEXT_FAST}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inlineData: { mimeType, data: base64 } },
            { text: SYSTEM_PROMPT }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', err);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return NextResponse.json({ error: 'No analysis result' }, { status: 500 });
    }

    const floorplan = JSON.parse(text);

    // Validate basic structure
    if (!floorplan.walls || !floorplan.rooms) {
      return NextResponse.json({ error: 'Invalid floor plan data' }, { status: 500 });
    }

    return NextResponse.json(floorplan);
  } catch (error) {
    console.error('Floorplan analyze error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
