import { NextRequest, NextResponse } from 'next/server';
import { AI_MODELS, GEMINI_BASE_URL } from '@/lib/ai-config';
import { floorplanToPascalScene } from '@/lib/floorplan-to-pascal';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PROMPT = `You are an expert architectural floor plan analyzer. Given an image of a floor plan (hand-drawn, professional, or photographed), extract all structural elements precisely.

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
- All coordinates in METERS, origin at (0,0) top-left
- Walls: line segments. Thickness 0.12-0.20m interior, 0.20-0.30m exterior
- Rooms: clockwise polygon points. Name in plan language
- Doors: center position on wall. Standard 0.8-0.9m
- Windows: center on wall. Standard 1.0-1.5m
- Use dimensions shown on plan if available, else estimate
- Include ALL walls including partitions
- Connect walls at corners (shared endpoints)`;

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
