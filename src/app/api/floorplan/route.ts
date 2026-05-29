import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { creditGuard } from "@/lib/credit-guard";
import { refundCreditCharge } from "@/lib/credit-refunds";
import { claimShavuotGiftAfterSuccessfulAction } from "@/lib/gift-campaigns";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";

const GEMINI_KEY = process.env.GEMINI_API_KEY || "";

const DEMO_FLOORPLANS: Record<string, { filename: string; mimeType: string }> = {
  "option-1": { filename: "floorplan-demo-option-1.jpg", mimeType: "image/jpeg" },
  "option-2": { filename: "floorplan-demo-option-2.jpg", mimeType: "image/jpeg" },
};

// Style presets with detailed prompts
const STYLES: Record<string, { name: string; prompt: string }> = {
  "modern-cabin": {
    name: "Modern Cabin",
    prompt: `Style: Luxury Modern Cabin - high ceilings, exposed timber beams, warm natural wood throughout, wide plank flooring, large floor-to-ceiling glass windows and sliding glass doors, expansive glazing facing exterior areas, cozy yet contemporary cabin aesthetic. Use light and warm wood tones, natural stone accents, soft warm lighting, and comfortable furnishings and natural romantic decorations.`,
  },
  "scandinavian": {
    name: "Scandinavian",
    prompt: `Style: Scandinavian Minimalist - clean lines, white and light gray walls, pale oak flooring, abundant natural light, minimalist furniture with organic shapes, hygge atmosphere. Use muted pastel accents, natural textiles (wool, linen), indoor plants, and simple elegant decor. Bright, airy, and serene.`,
  },
  "industrial": {
    name: "Industrial Loft",
    prompt: `Style: Industrial Loft - exposed brick walls, concrete floors with area rugs, black metal framework, edison bulb lighting, large factory-style windows, raw materials mixed with refined furniture. Use dark metals, reclaimed wood, leather seating, and urban art pieces. Edgy yet sophisticated.`,
  },
  "mediterranean": {
    name: "Mediterranean",
    prompt: `Style: Mediterranean Villa - terracotta tile flooring, arched doorways and windows, whitewashed walls, wrought iron details, lush indoor greenery. Use warm earth tones, mosaic tile accents, natural stone, rustic wooden beams, and colorful ceramic pottery. Warm, inviting, and sun-drenched.`,
  },
  "japandi": {
    name: "Japandi",
    prompt: `Style: Japandi (Japanese-Scandinavian fusion) - clean minimalist lines with wabi-sabi imperfection, low-profile furniture, tatami-inspired flooring areas, shoji screen dividers, natural materials. Use muted earth tones, bamboo, light wood, ceramics, and careful negative space. Calm, balanced, and intentional.`,
  },
  "luxury-modern": {
    name: "Luxury Modern",
    prompt: `Style: Ultra Luxury Modern - high-end contemporary design, marble flooring with brass inlays, designer furniture, statement lighting fixtures, floor-to-ceiling windows with sheer curtains. Use monochromatic palette with gold accents, Italian marble, velvet upholstery, and curated art pieces. Opulent yet tasteful.`,
  },
  "boho": {
    name: "Bohemian",
    prompt: `Style: Bohemian Eclectic - layered textiles, patterned rugs and throws, rattan and wicker furniture, macramé wall hangings, abundant plants. Use warm jewel tones mixed with neutrals, global-inspired patterns, vintage finds, and handcrafted accessories. Free-spirited, colorful, and collected.`,
  },
  "classic": {
    name: "Classic Elegant",
    prompt: `Style: Classic Elegant - traditional design with crown moldings, wainscoting, hardwood herringbone flooring, crystal chandeliers, symmetrical arrangements. Use rich fabrics (silk, damask), antique-inspired furniture, deep colors (navy, burgundy, emerald), and gilded frames. Timeless, refined, and sophisticated.`,
  },
};

export async function POST(req: NextRequest) {
  let chargedUserEmail: string | null = null;
  let chargedCost = 0;
  const refundIfNeeded = (reason: string) =>
    refundCreditCharge(chargedUserEmail, chargedCost, `floorplan_${reason}`);

  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const styleKey = formData.get("style") as string;
    const userEmail = formData.get("email") as string;
    const isDemo = formData.get("demo") === "true";
    const demoKey = String(formData.get("demoKey") || "option-1");

    if ((!image && !isDemo) || !styleKey) {
      return NextResponse.json({ error: "Missing image or style" }, { status: 400 });
    }

    if (isDemo) {
      if (!DEMO_FLOORPLANS[demoKey]) {
        return NextResponse.json({ error: "Invalid demo floorplan" }, { status: 400 });
      }
      const clientId = getClientId(req);
      const rateLimit = checkRateLimit(`floorplan-demo:${clientId}:${demoKey}`, 3, 24 * 60 * 60 * 1000);
      if (!rateLimit.success) {
        return NextResponse.json({ error: "יותר מדי הדמיות דוגמה כרגע. נסו שוב מאוחר יותר." }, { status: 429 });
      }
    } else {
      // Credit check
      if (!userEmail) return NextResponse.json({ error: "נדרשת התחברות" }, { status: 401 });
      const creditCheck = await creditGuard(userEmail, 'floorplan');
      if ('error' in creditCheck) return creditCheck.error;
      chargedUserEmail = userEmail;
      chargedCost = creditCheck.cost;
    }

    const style = STYLES[styleKey];
    // Allow custom style text (not in STYLES dict)
    const stylePrompt = style
      ? style.prompt
      : `Style: ${styleKey} - apply this design style throughout the apartment with appropriate materials, colors, furniture, and atmosphere that match this aesthetic.`;

    const demoFloorplan = DEMO_FLOORPLANS[demoKey] || DEMO_FLOORPLANS["option-1"];
    const bytes = isDemo
      ? await readFile(path.join(process.cwd(), "public/examples", demoFloorplan.filename))
      : Buffer.from(await image!.arrayBuffer());
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = isDemo ? demoFloorplan.mimeType : image!.type || "image/jpeg";

    const prompt = `Analyze the provided floor plan and generate a finished interior design rendering of the entire apartment from directly above.

Critical output requirements:
- True 90 degree top-down orthographic apartment render, like a furnished dollhouse floor seen from the ceiling.
- Preserve the exact room layout, proportions, walls, doors, openings, windows, and orientation from the uploaded plan.
- Convert the flat plan into a realistic furnished overhead interior: floors, rugs, beds, sofas, kitchen counters, dining table, bathroom fixtures, cabinetry, lighting, and decor should be visible from above.
- Use a bright premium architectural maquette look: soft white or cream walls, pale natural materials, gentle shadows, clean real-estate presentation, and clear daylight.
- Keep all walls and rooms readable, but the image must look like a designed apartment render, not a schematic drawing.
- Do not add labels, text, captions, room names, arrows, icons, UI elements, or watermark.
- Do not output another blueprint, line diagram, cartoon map, or simplified floor-plan sketch.
- Do not use perspective camera, isometric angle, side view, or 3D exterior view.
- Avoid dark blueprint-like walls, thick black outlines, neon colors, and technical diagram styling.

${stylePrompt}

Single cohesive image only. Ultra-realistic materials, clean architectural visualization quality, physically plausible daylight, no perspective distortion, no added or removed structural elements.`;

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
      await refundIfNeeded("ai_error");
      return NextResponse.json({ error: `AI generation failed: ${err.substring(0, 200)}` }, { status: 500 });
    }

    const data = await response.json();
    
    // Check for blocked/filtered response
    if (data.candidates?.[0]?.finishReason === "SAFETY") {
      await refundIfNeeded("safety");
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
      await refundIfNeeded("no_image");
      return NextResponse.json({
        error: resultText || "No image generated - the AI returned text only. Try again.",
      }, { status: 500 });
    }

    chargedUserEmail = null;
    chargedCost = 0;
    const giftClaim = isDemo ? null : await claimShavuotGiftAfterSuccessfulAction(req, userEmail, 'floorplan');
    return NextResponse.json({
      image: resultImage,
      text: resultText,
      style: style?.name || styleKey,
      giftClaim,
    });
  } catch (error: unknown) {
    await refundIfNeeded("server_error");
    const message = error instanceof Error ? error.message : "Floorplan generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
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
