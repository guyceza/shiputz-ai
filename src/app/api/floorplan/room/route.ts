import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { isAdminEmail } from "@/lib/admin";
import { creditGuard } from "@/lib/credit-guard";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

const STYLE_PROMPTS: Record<string, string> = {
  "modern-cabin":
    "modern wooden cabin style with exposed timber beams, warm natural wood, wide plank flooring, large glass windows, cozy contemporary cabin aesthetic, warm wood tones, natural stone accents, soft warm lighting, comfortable furnishings",
  scandinavian:
    "Scandinavian minimalist style with clean lines, white walls, pale oak flooring, natural light, minimalist furniture, hygge atmosphere, muted pastel accents, natural textiles, indoor plants",
  industrial:
    "industrial loft style with exposed brick walls, concrete floors, black metal framework, edison bulb lighting, factory-style windows, dark metals, reclaimed wood, leather seating",
  mediterranean:
    "Mediterranean villa style with terracotta tile flooring, arched doorways, whitewashed walls, wrought iron details, warm earth tones, mosaic tile accents, natural stone, rustic wooden beams",
  japandi:
    "Japandi style with clean minimalist lines, wabi-sabi imperfection, low-profile furniture, natural materials, muted earth tones, bamboo, light wood, ceramics, negative space",
  "luxury-modern":
    "ultra luxury modern style with marble flooring, designer furniture, statement lighting, floor-to-ceiling windows, monochromatic palette with gold accents, Italian marble, velvet upholstery",
  boho:
    "bohemian eclectic style with layered textiles, patterned rugs, rattan furniture, macramé, abundant plants, warm jewel tones, global-inspired patterns, handcrafted accessories",
  classic:
    "classic elegant style with crown moldings, wainscoting, hardwood herringbone flooring, crystal chandeliers, rich fabrics, antique-inspired furniture, deep colors",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const floorplanImage = formData.get("floorplan") as File | null; // the top-down rendering
    const roomName = formData.get("room") as string;
    const styleKey = formData.get("style") as string;
    const userEmail = formData.get("email") as string;
    const cameraAngle = formData.get("cameraAngle") as string || "";

    if (!floorplanImage || !roomName) {
      return NextResponse.json({ error: "Missing floorplan image or room name" }, { status: 400 });
    }

    if (!userEmail) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
    const creditCheck = await creditGuard(userEmail, 'room-photo');
    if ('error' in creditCheck) return creditCheck.error;

    const styleDesc = STYLE_PROMPTS[styleKey] || (styleKey ? `${styleKey} style — apply this design aesthetic with appropriate materials, colors, furniture, and atmosphere` : STYLE_PROMPTS["modern-cabin"]);

    const bytes = await floorplanImage.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = floorplanImage.type || "image/jpeg";

    const prompt = `Based on this top-down floor plan rendering, generate an ultra-realistic interior photograph of the ${roomName}. ${cameraAngle ? `Camera position: ${cameraAngle}.` : `Use a natural eye-level perspective showing the room from an appealing angle.`}

Style: ${styleDesc}.

The layout, dimensions, and furniture placement must match the floor plan precisely. Generate a photorealistic interior render with:
- Physically accurate lighting (natural light from windows + warm artificial lights)
- Ultra-realistic materials and textures
- Proper depth of field and atmospheric perspective
- High resolution architectural photography quality
- The room should feel lived-in and inviting, not sterile

Output a single photorealistic interior photograph.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inlineData: { mimeType, data: base64 } },
              { text: prompt },
            ],
          }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            temperature: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini room error:", err);
      return NextResponse.json({ error: "Room generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    let resultImage = null;
    let resultText = "";

    for (const part of parts) {
      if (part.inlineData) {
        resultImage = { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
      if (part.text) resultText += part.text;
    }

    if (!resultImage) {
      return NextResponse.json({ error: "No image generated", text: resultText }, { status: 500 });
    }

    return NextResponse.json({ image: resultImage, text: resultText, room: roomName });
  } catch (error: any) {
    console.error("Room API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
