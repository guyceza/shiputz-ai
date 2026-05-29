export const CREDIT_COSTS = {
  visualize: 12, // AI Room Visualization
  floorplan: 15, // Floor Plan rendering
  "room-photo": 8, // Room photo from floorplan
  "furniture-swap": 8, // Furniture replacement
  "video-walkthrough": 35, // Video tour
  "shop-look": 6, // Product detection / shopping
  "bill-of-quantities": 18, // כתב כמויות
  "scan-receipt": 5, // Receipt scanning
  "analyze-quote": 8, // Quote analysis
  "ai-assistant": 0, // Unlimited for active subscribers; gated by subscription, not credits.
  "style-match": 6, // Style Matcher
  "detect-items": 6, // Detect items in image
} as const;

export const SIGNUP_BONUS_CREDITS = CREDIT_COSTS.visualize;

export type CreditAction = keyof typeof CREDIT_COSTS;

export const CREDIT_FEATURE_LABELS: Record<CreditAction, string> = {
  visualize: "הדמיית שיפוץ",
  floorplan: "תוכנית קומה",
  "room-photo": "תמונת חדר מתוך תוכנית",
  "furniture-swap": "החלפת רהיט",
  "video-walkthrough": "סיור וידאו",
  "shop-look": "Shop the Look",
  "bill-of-quantities": "כתב כמויות",
  "scan-receipt": "סריקת קבלות",
  "analyze-quote": "ניתוח הצעת מחיר",
  "ai-assistant": "עוזר AI לשיפוץ",
  "style-match": "Style Matcher",
  "detect-items": "זיהוי פריטים",
};

export const CREDIT_PACK_ANCHORS = [
  { credits: 20, price: 29 },
  { credits: 50, price: 49 },
  { credits: 100, price: 89 },
  { credits: 200, price: 159 },
  { credits: 300, price: 219 },
] as const;

export const CREDIT_PACK_STEPS = [20, 50, 75, 100, 150, 200, 250, 300] as const;

export const CREDIT_PACK_MIN = CREDIT_PACK_ANCHORS[0].credits;
export const CREDIT_PACK_MAX = CREDIT_PACK_ANCHORS[CREDIT_PACK_ANCHORS.length - 1].credits;

export function getCreditPackPrice(credits: number): number {
  const anchors = CREDIT_PACK_ANCHORS;

  if (credits <= anchors[0].credits) return anchors[0].price;

  const last = anchors[anchors.length - 1];
  if (credits >= last.credits) {
    return Math.round(credits * (last.price / last.credits));
  }

  for (let i = 0; i < anchors.length - 1; i++) {
    if (credits >= anchors[i].credits && credits <= anchors[i + 1].credits) {
      const t = (credits - anchors[i].credits) / (anchors[i + 1].credits - anchors[i].credits);
      return Math.round(anchors[i].price + t * (anchors[i + 1].price - anchors[i].price));
    }
  }

  return 0;
}

export function getCreditPackUnitPrice(credits: number): string {
  return (getCreditPackPrice(credits) / credits).toFixed(2);
}
