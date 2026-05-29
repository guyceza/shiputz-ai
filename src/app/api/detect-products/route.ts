export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from '@/lib/supabase';
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";
import { checkRateLimit, getClientId } from "@/lib/rate-limit";
import { creditGuard } from "@/lib/credit-guard";
import { refundCreditCharge } from "@/lib/credit-refunds";
import { claimShavuotGiftAfterSuccessfulAction } from "@/lib/gift-campaigns";

// Verify user exists (Shop the Look is part of the visualization experience, including trial)
async function verifyUserExists(userEmail: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail.toLowerCase())
      .single();
    return !!data;
  } catch {
    return false;
  }
}

type DetectedProduct = {
  id: string;
  name: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  marker: {
    top: number;
    left: number;
  };
  searchQuery: string;
};

type RawDetectedProduct = {
  id?: unknown;
  name?: unknown;
  searchQuery?: unknown;
  query?: unknown;
  marker?: {
    top?: unknown;
    left?: unknown;
    x?: unknown;
    y?: unknown;
  };
  position?: {
    top?: unknown;
    left?: unknown;
    width?: unknown;
    height?: unknown;
    x?: unknown;
    y?: unknown;
    centerTop?: unknown;
    centerLeft?: unknown;
    centerX?: unknown;
    centerY?: unknown;
  };
};

const PRODUCT_DETECTION_PROMPT = `You are a visual product matching expert for interior design shopping in Israel.

Your job is NOT to label objects generically. Your job is to create precise Google Shopping searches for products that visually match the room image.

CRITICAL: Position values MUST be a tight bounding box in percentages (0-100), NOT pixels.
- top: percentage from top of image to the TOP EDGE of the item box
- left: percentage from left of image to the LEFT EDGE of the item box
- width: approximate item box width as percentage of image width
- height: approximate item box height as percentage of image height
- The clickable marker will be rendered in the center of this box, so the box must tightly cover the visible product.
- Do not place boxes on empty floor/wall areas near the product.
- Never return a box outside the visible image. If an item is partly cropped, box only the visible part.
- If the image has blank padding, side margins, letterboxing, or a generated empty background around the room/photo, ignore those empty areas. Coordinates still use the full image percentages, but every box and marker must sit on the actual visible product content.
- If you are uncertain, use a smaller centered box on the visible object instead of a large loose box.

Find 5-8 purchasable furniture/decor items only. Prefer visible items a user would reasonably buy:
- sofas, armchairs, chairs, tables, rugs, lamps, chandeliers, curtains, art, pillows, plants, sideboards, kitchen stools, shelves
- Skip walls, ceiling, windows, doors, generic floor unless it is a clearly purchasable finish

For EVERY item:
1. name: a specific Hebrew commercial product name, not a category.
2. marker: the exact center point where the app should show the magnifying-glass icon, in percentages of the full image.
   - marker.top: percentage from top of image to the visual center of the item
   - marker.left: percentage from left of image to the visual center of the item
   - The marker must sit on the object itself, not on nearby wall, floor, blank padding, side margins, or empty space.
3. searchQuery: a Hebrew Google Shopping query that is specific enough to find a visually similar product.

Search query rules:
- NEVER use one-word or generic searches like "שטיח", "ספה", "כיסא", "מנורה".
- Include as many visible attributes as possible: product subtype, material, color, shape, texture/pattern, style, size/usage.
- If the item is a rug, identify the rug type when visible: שאגי / פרסי / קילים / ברבר / גאומטרי / צמר / יוטה / עגול / מלבני / אפור / בז / עבה / דק.
- If the item is a sofa/chair, include upholstery/material, color, seat count or silhouette, style, legs/frame if visible.
- If the item is lighting, include fixture type, finish/material, number of arms/shades, style.
- If you cannot know a brand/model from the image, do not invent one.
- Do not add "לקנות בישראל"; the app adds that automatically.
- Good examples:
  - "שטיח שאגי אפור מלבני עבה לסלון"
  - "כורסאת ראטן ועץ עם כרית חרדל וינטג"
  - "נברשת פליז קלאסית 5 קנים אהילי זכוכית"
  - "ספת עור שחורה דו מושבית מודרנית"

Return ONLY a JSON array, no markdown and no explanation:
[{"id":"item-1","name":"שטיח שאגי אפור מלבני","position":{"top":63,"left":38,"width":28,"height":18},"marker":{"top":72,"left":52},"searchQuery":"שטיח שאגי אפור מלבני עבה לסלון"}]`;

function extractJsonArray(text: string): unknown[] | null {
  const cleanText = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
  const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return null;
  const parsed = JSON.parse(arrayMatch[0]);
  return Array.isArray(parsed) ? parsed : null;
}

function cleanProductText(value: unknown): string {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function finiteNumber(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function clampPercent(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeDetectedProducts(items: unknown[]): DetectedProduct[] {
  return items
    .map((raw, index) => {
      const item = raw as RawDetectedProduct;
      const pos = item?.position || {};
      const top = finiteNumber(pos.top ?? pos.y);
      const left = finiteNumber(pos.left ?? pos.x);
      const width = finiteNumber(pos.width) ?? 8;
      const height = finiteNumber(pos.height) ?? 8;
      const name = cleanProductText(item?.name);
      const searchQuery = cleanProductText(item?.searchQuery || item?.query || name);

      if (top === null || left === null) return null;

      const safeLeft = clampPercent(left, 0, 97);
      const safeTop = clampPercent(top, 0, 97);
      const safeWidth = Math.max(3, Math.min(width, 100 - safeLeft));
      const safeHeight = Math.max(3, Math.min(height, 100 - safeTop));
      const rawMarker = item?.marker || {};
      const markerLeft =
        finiteNumber(rawMarker.left ?? rawMarker.x ?? pos.centerLeft ?? pos.centerX) ??
        safeLeft + safeWidth / 2;
      const markerTop =
        finiteNumber(rawMarker.top ?? rawMarker.y ?? pos.centerTop ?? pos.centerY) ??
        safeTop + safeHeight / 2;

      return {
        id: cleanProductText(item?.id) || `item-${index + 1}`,
        name,
        position: { top: safeTop, left: safeLeft, width: safeWidth, height: safeHeight },
        marker: {
          top: clampPercent(markerTop, 2, 98),
          left: clampPercent(markerLeft, 2, 98),
        },
        searchQuery,
      };
    })
    .filter((item): item is DetectedProduct => item !== null)
    .filter((item) => {
      const pos = item.position;
      return item.name.length > 0 &&
        item.searchQuery.length > 0 &&
        Number.isFinite(pos.top) && pos.top >= 0 && pos.top <= 100 &&
        Number.isFinite(pos.left) && pos.left >= 0 && pos.left <= 100 &&
        Number.isFinite(pos.width) && pos.width > 0 && pos.width <= 100 &&
        Number.isFinite(pos.height) && pos.height > 0 && pos.height <= 100;
    });
}

export async function POST(request: NextRequest) {
  let chargedUserEmail: string | null = null;
  let chargedCost = 0;
  const refundIfNeeded = (reason: string) =>
    refundCreditCharge(chargedUserEmail, chargedCost, `shop-look_${reason}`);

  try {
    // Rate limit: 30 requests per minute
    const clientId = getClientId(request);
    const rateLimit = checkRateLimit(clientId, 30, 60000);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { image, userEmail } = body;

    // Auth check - verify user exists and has premium
    if (!userEmail) {
      return NextResponse.json({ 
        error: "נדרשת התחברות לשימוש בשירות זה" 
      }, { status: 401 });
    }
    
    const userExists = await verifyUserExists(userEmail);
    if (!userExists) {
      return NextResponse.json({ error: "נדרשת התחברות לשימוש בשירות זה" }, { status: 401 });
    }

    if (!image) {
      return NextResponse.json({ error: "Missing image" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Extract base64 data - handle both data URLs and regular URLs
    let imageBase64 = image;
    let mimeType = "image/jpeg";
    
    if (image.startsWith("data:")) {
      // Data URL - extract base64
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      }
    } else if (image.startsWith("http://") || image.startsWith("https://")) {
      // URL - fetch and convert to base64
      try {
        const imageResponse = await fetch(image);
        if (!imageResponse.ok) {
          return NextResponse.json({ items: [], error: "Failed to fetch image" });
        }
        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
        mimeType = contentType.split(";")[0];
        const arrayBuffer = await imageResponse.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
      } catch {
        return NextResponse.json({ items: [], error: "Failed to fetch image" });
      }
    }

    const creditCheck = await creditGuard(userEmail, 'shop-look');
    if ('error' in creditCheck) return creditCheck.error;
    chargedUserEmail = userEmail;
    chargedCost = creditCheck.cost;

    // Use the fastest strong vision model for product detection.
    const geminiUrl = `${GEMINI_BASE_URL}/${AI_MODELS.VISION_FAST}:generateContent?key=${apiKey}`;
    
    const geminiPayload = {
      contents: [{
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: imageBase64
            }
          },
          {
            text: PRODUCT_DETECTION_PROMPT
          }
        ]
      }]
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      await refundIfNeeded("ai_error");
      return NextResponse.json({ items: [] });
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON from response
    try {
      const items = extractJsonArray(responseText);
      if (items) {
        const validItems = normalizeDetectedProducts(items);
        if (validItems.length === 0) {
          await refundIfNeeded("empty_result");
        } else {
          chargedUserEmail = null;
          chargedCost = 0;
        }
        const giftClaim = validItems.length > 0
          ? await claimShavuotGiftAfterSuccessfulAction(request, userEmail, 'shop-look')
          : { claimed: false, reason: 'empty_result' };
        return NextResponse.json({ items: validItems, products: validItems, giftClaim });
      }
    } catch (parseError) {
      console.error("[detect-products] Failed to parse product detection response:", parseError);
      await refundIfNeeded("parse_error");
      return NextResponse.json({ items: [] });
    }

    await refundIfNeeded("no_data");
    return NextResponse.json({ items: [] });

  } catch {
    await refundIfNeeded("server_error");
    return NextResponse.json({ items: [] });
  }
}
