import { NextRequest, NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { isAdminEmail } from "@/lib/admin";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

// Style presets with detailed prompts
const STYLES: Record<string, { name: string; prompt: string }> = {
  "modern-cabin": {
    name: "Modern Cabin",
    prompt: `Style: Luxury Modern Cabin — high ceilings, exposed timber beams, warm natural wood throughout, wide plank flooring, large floor-to-ceiling glass windows and sliding glass doors, expansive glazing facing exterior areas, cozy yet contemporary cabin aesthetic. Use light and warm wood tones, natural stone accents, soft warm lighting, and comfortable furnishings and natural romantic decorations.`,
  },
  "scandinavian": {
    name: "Scandinavian",
    prompt: `Style: Scandinavian Minimalist — clean lines, white and light gray walls, pale oak flooring, abundant natural light, minimalist furniture with organic shapes, hygge atmosphere. Use muted pastel accents, natural textiles (wool, linen), indoor plants, and simple elegant decor. Bright, airy, and serene.`,
  },
  "industrial": {
    name: "Industrial Loft",
    prompt: `Style: Industrial Loft — exposed brick walls, concrete floors with area rugs, black metal framework, edison bulb lighting, large factory-style windows, raw materials mixed with refined furniture. Use dark metals, reclaimed wood, leather seating, and urban art pieces. Edgy yet sophisticated.`,
  },
  "mediterranean": {
    name: "Mediterranean",
    prompt: `Style: Mediterranean Villa — terracotta tile flooring, arched doorways and windows, whitewashed walls, wrought iron details, lush indoor greenery. Use warm earth tones, mosaic tile accents, natural stone, rustic wooden beams, and colorful ceramic pottery. Warm, inviting, and sun-drenched.`,
  },
  "japandi": {
    name: "Japandi",
    prompt: `Style: Japandi (Japanese-Scandinavian fusion) — clean minimalist lines with wabi-sabi imperfection, low-profile furniture, tatami-inspired flooring areas, shoji screen dividers, natural materials. Use muted earth tones, bamboo, light wood, ceramics, and careful negative space. Calm, balanced, and intentional.`,
  },
  "luxury-modern": {
    name: "Luxury Modern",
    prompt: `Style: Ultra Luxury Modern — high-end contemporary design, marble flooring with brass inlays, designer furniture, statement lighting fixtures, floor-to-ceiling windows with sheer curtains. Use monochromatic palette with gold accents, Italian marble, velvet upholstery, and curated art pieces. Opulent yet tasteful.`,
  },
  "boho": {
    name: "Bohemian",
    prompt: `Style: Bohemian Eclectic — layered textiles, patterned rugs and throws, rattan and wicker furniture, macramé wall hangings, abundant plants. Use warm jewel tones mixed with neutrals, global-inspired patterns, vintage finds, and handcrafted accessories. Free-spirited, colorful, and collected.`,
  },
  "classic": {
    name: "Classic Elegant",
    prompt: `Style: Classic Elegant — traditional design with crown moldings, wainscoting, hardwood herringbone flooring, crystal chandeliers, symmetrical arrangements. Use rich fabrics (silk, damask), antique-inspired furniture, deep colors (navy, burgundy, emerald), and gilded frames. Timeless, refined, and sophisticated.`,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const styleKey = formData.get("style") as string;
    const userEmail = formData.get("email") as string;

    if (!image || !styleKey) {
      return NextResponse.json({ error: "Missing image or style" }, { status: 400 });
    }

    // Auth check - admin only for now
    if (!userEmail || !isAdminEmail(userEmail)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const style = STYLES[styleKey];
    if (!style) {
      return NextResponse.json({ error: "Invalid style" }, { status: 400 });
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    const prompt = `Analyze the provided floor plan and generate a photorealistic top-down (true 90° orthographic) rendering of the entire apartment, strictly preserving the exact dimensions, proportions, walls, doors, windows, and furniture placement as shown. Do not modify layout, scale, structure, or orientation. ${style.prompt} Architectural visualization style, ultra-realistic materials, physically accurate lighting, no perspective distortion, no added or removed structural elements. The output must be a single cohesive image showing the full apartment from directly above.`;

    const response = await fetch(
      `${GEMINI_BASE_URL}/${AI_MODELS.IMAGE_GEN}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            temperature: 0.4,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: `AI generation failed: ${err.substring(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();
    
    // Check for blocked/filtered response
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      return NextResponse.json({ error: "Content was filtered by safety settings. Try a different image." }, { status: 400 });
    }
    
    const parts = data.candidates?.[0]?.content?.parts || [];

    let resultImage = null;
    let resultText = "";

    for (const part of parts) {
      if (part.inlineData) {
        resultImage = {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        };
      }
      if (part.text) {
        resultText += part.text;
      }
    }

    if (!resultImage) {
      console.error("No image in response:", JSON.stringify(data).substring(0, 500));
      return NextResponse.json({
        error: resultText || "No image generated — the AI returned text only. Try again.",
      }, { status: 500 });
    }

    return NextResponse.json({
      image: resultImage,
      text: resultText,
      style: style.name,
    });
  } catch (error: any) {
    console.error("Floorplan API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to return available styles
export async function GET() {
  const styles = Object.entries(STYLES).map(([key, val]) => ({
    key,
    name: val.name,
  }));
  return NextResponse.json({ styles });
}
