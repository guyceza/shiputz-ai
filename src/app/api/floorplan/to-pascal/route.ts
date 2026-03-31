import { NextRequest, NextResponse } from 'next/server';
import { AI_MODELS, GEMINI_BASE_URL } from '@/lib/ai-config';
import { floorplanToPascalScene } from '@/lib/floorplan-to-pascal';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PROMPT = `You are an expert architectural floor plan analyzer. Analyze this floor plan image and extract ALL structural elements.

Return ONLY valid JSON with this structure:
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

CRITICAL RULES:
1. COORDINATE SYSTEM: All values in METERS. Origin (0,0) at top-left of the plan. X increases rightward, Y increases downward.
2. DIMENSIONS: If dimensions/measurements are shown on the plan, use those exact values. Otherwise estimate from typical room sizes (bedroom ~12-15sqm, bathroom ~4-6sqm, kitchen ~8-12sqm, living room ~20-30sqm).
3. WALLS - MOST IMPORTANT:
   - Every wall is a line segment from start [x,y] to end [x,y]
   - Include ALL walls: exterior perimeter AND interior partition walls
   - Walls MUST connect at corners: if wall A ends at [5,0] and wall B starts at [5,0], they share that exact point
   - Trace the FULL exterior perimeter as connected wall segments
   - Then add all interior dividing walls
   - Exterior wall thickness: 0.20-0.30m. Interior walls: 0.10-0.15m
   - Each wall should be a straight segment. For L-shaped walls, use two segments meeting at the corner
4. ROOMS: Polygon points define room boundary clockwise. Use room names as shown on the plan (Hebrew if Hebrew plan). MUST include "type" field: bedroom, bathroom, kitchen, living, hallway, balcony, storage, laundry, entrance, office, dining, kids
5. DOORS: Position is the center point [x,y] on the wall where the door is. Width typically 0.8-0.9m
6. WINDOWS: Position is center point [x,y] on the wall. Width typically 1.0-1.5m

VERIFICATION: After generating, verify that:
- All exterior walls form a closed loop (last wall end = first wall start)
- All interior walls connect to exterior walls or other interior walls at their endpoints
- Every room is fully enclosed by walls
- Door/window positions lie on or very near a wall`;

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
            { text: PROMPT }
          ]
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return NextResponse.json({ error: 'No analysis result' }, { status: 500 });
    }

    const floorplan = JSON.parse(text);
    const sceneGraph = floorplanToPascalScene(floorplan);

    return NextResponse.json({ 
      sceneGraph,
      analysis: floorplan 
    });
  } catch (error: any) {
    console.error('Floorplan to Pascal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
