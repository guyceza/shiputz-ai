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

    let floorplan = JSON.parse(text);
    
    // Gemini sometimes returns [{...}] instead of {...}
    if (Array.isArray(floorplan)) {
      floorplan = floorplan[0] || {};
    }
    
    // Normalize: ensure arrays
    if (!Array.isArray(floorplan.walls)) floorplan.walls = [];
    if (!Array.isArray(floorplan.rooms)) floorplan.rooms = [];
    if (!Array.isArray(floorplan.doors)) floorplan.doors = [];
    if (!Array.isArray(floorplan.windows)) floorplan.windows = [];
    
    // Validate wall format
    floorplan.walls = floorplan.walls.filter((w: any) => {
      return Array.isArray(w?.start) && w.start.length >= 2 && 
             Array.isArray(w?.end) && w.end.length >= 2;
    });
    
    // Auto-detect if coordinates are in cm/pixels (values > 50 suggest non-meter units)
    // and convert to meters
    const allCoords = floorplan.walls.flatMap((w: any) => [...w.start, ...w.end]);
    const maxCoord = Math.max(...allCoords, 0);
    
    if (maxCoord > 50) {
      // Likely centimeters or pixels — determine scale
      // Use dimensions hint if available, otherwise assume cm
      const dims = floorplan.dimensions;
      let scale: number;
      if (dims?.width && dims.width < 50) {
        // dimensions are in meters, coords are in something else
        scale = dims.width / maxCoord;
      } else {
        // Assume centimeters → meters
        scale = 0.01;
      }
      
      console.log(`Auto-scaling coordinates: maxCoord=${maxCoord}, scale=${scale}`);
      
      // Scale walls
      for (const w of floorplan.walls) {
        w.start = [w.start[0] * scale, w.start[1] * scale];
        w.end = [w.end[0] * scale, w.end[1] * scale];
        if (w.thickness) w.thickness = w.thickness * scale;
      }
      
      // Scale rooms
      for (const r of floorplan.rooms) {
        if (Array.isArray(r.polygon)) {
          r.polygon = r.polygon.map((p: number[]) => [p[0] * scale, p[1] * scale]);
        }
      }
      
      // Scale doors
      for (const d of floorplan.doors) {
        if (Array.isArray(d.position)) {
          d.position = [d.position[0] * scale, d.position[1] * scale];
        }
        if (d.width) d.width = d.width * scale;
      }
      
      // Scale windows
      for (const w of floorplan.windows) {
        if (Array.isArray(w.position)) {
          w.position = [w.position[0] * scale, w.position[1] * scale];
        }
        if (w.width) w.width = w.width * scale;
      }
      
      // Update dimensions
      if (dims) {
        if (dims.width > 50) dims.width = dims.width * scale;
        if (dims.height > 50) dims.height = dims.height * scale;
      }
    }
    
    // Ensure minimum wall thickness
    for (const w of floorplan.walls) {
      if (!w.thickness || w.thickness < 0.05) w.thickness = 0.15;
    }
    
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
