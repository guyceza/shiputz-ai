/**
 * Pricing data based on Midrag.co.il real transaction data (2026)
 * Source: https://www.midrag.co.il/Content/MainPriceList
 * 
 * This data is used to provide accurate cost estimates for renovation projects.
 * All prices are in ILS (₪) and represent market averages from actual transactions.
 */

// =============================================================================
// GENERAL RENOVATION COSTS
// =============================================================================

export const RENOVATION_BASE_PRICES = {
  // Price per square meter by renovation type
  cosmetic: { min: 450, max: 700, avg: 550 },      // צביעה, תיקונים קטנים
  complete: { min: 1400, max: 2000, avg: 1700 },   // שיפוץ קומפלט
  luxury: { min: 3000, max: 4000, avg: 3500 },     // יוקרתי
} as const;

// Full renovation breakdown (90 sqm example from Midrag)
export const FULL_RENOVATION_BREAKDOWN = {
  // גבס ופירוק/בנייה
  drywall: { min: 10700, max: 13000, description: "פירוק ובנייה, גבס מבודד" },
  // אינסטלציה (7 נקודות)
  plumbing: { min: 18670, max: 22820, description: "החלפת צנרת, 7 נקודות אינסטלציה" },
  // חשמל (20 נקודות)
  electrical: { min: 9400, max: 11500, description: "20 נקודות חשמל, שקעי גביס" },
  // ריצוף (3 חדרים)
  flooring: { min: 27400, max: 33450, description: "ריצוף קרמיקה איכותי, 3 חדרים" },
  // מטבח
  kitchen: { min: 41400, max: 50600, description: "מטבח חדש, עץ סנדביץ', שיש קוריאן" },
  // אלומיניום
  aluminum: { min: 41100, max: 50250, description: "חלונות, תריסים, רשתות" },
  // צביעה
  painting: { min: 7500, max: 9170, description: "צביעה איכותית, 3 שכבות, כולל תקרות" },
} as const;

// =============================================================================
// BATHROOM COSTS
// =============================================================================

export const BATHROOM_PRICES = {
  budget: { min: 16000, max: 25000, description: "תקציב נמוך" },
  standard: { min: 25000, max: 32000, description: "סטנדרטי" },
  luxury: { min: 32000, max: 45000, description: "יוקרתי" },
  
  // Detailed breakdown
  breakdown: {
    demolition: { min: 4500, max: 6500, description: "פירוק ופינוי" },
    plumbingPipes: { min: 9600, max: 11000, description: "צנרת מים (6 נקודות)" },
    toiletPrep: { min: 1200, max: 1800, description: "הכנה לאסלה" },
    flooring: { min: 1300, max: 1700, description: "ריצוף 7 מ\"ר" },
    wallTiles: { min: 4500, max: 6000, description: "חיפוי קירות 28 מ\"ר" },
    grout: { min: 800, max: 1500, description: "רובה אקרילית" },
    painting: { min: 1200, max: 1600, description: "צביעה נגד עובש" },
    waterproofing: { min: 2000, max: 3000, description: "איטום סיקה 107" },
  },
} as const;

// =============================================================================
// KITCHEN COSTS
// =============================================================================

export const KITCHEN_PRICES = {
  refresh: { min: 5000, max: 15000, description: "חידוש - החלפת דלתות/פרזול" },
  newStandard: { min: 35000, max: 50000, description: "מטבח חדש סטנדרטי" },
  newLuxury: { min: 70000, max: 100000, description: "מטבח יוקרתי" },
  
  // Cabinet door prices (per door)
  cabinetDoors: {
    formica: { min: 200, max: 500, description: "פורמייקה" },
    polymer: { min: 400, max: 700, description: "פולימר" },
    epoxy: { min: 200, max: 400, description: "שלייפלק/אפוקסי" },
    glass: { min: 400, max: 800, description: "זכוכית" },
  },
  
  // Hardware
  hardware: {
    softCloseMechanisms: { min: 450, max: 600, description: "מסילות טריקה שקטה" },
    standardRails: { min: 50, max: 60, description: "מסילות רגילות" },
    handles: { min: 20, max: 70, description: "ידיות" },
  },
} as const;

// =============================================================================
// FLOORING COSTS
// =============================================================================

export const FLOORING_PRICES = {
  // Per square meter
  ceramic80x80: { min: 450, max: 700, description: "קרמיקה 80x80 כולל פירוק" },
  tileGluing: { min: 190, max: 250, description: "הדבקת ריצוף" },
  laminateParquet: { min: 90, max: 200, description: "פרקט למינציה" },
  outdoorStone: { min: 250, max: 350, description: "אבן טבעית חוץ" },
  outdoorGluing: { min: 200, max: 250, description: "הדבקת ריצוף חוץ" },
  
  // Full parquet prices
  parquet: {
    laminate: { min: 135, max: 215, description: "למינציה כולל אספקה" },
    solidWood: { min: 338, max: 620, description: "עץ גושני כולל אספקה" },
    threeLayer: { min: 285, max: 520, description: "תלת שכבתי כולל אספקה" },
    polymer: { min: 162, max: 234, description: "פולימרי כולל אספקה" },
  },
} as const;

// =============================================================================
// ELECTRICAL COSTS
// =============================================================================

export const ELECTRICAL_PRICES = {
  visit: { min: 289, max: 377, description: "ביקור לבדיקה" },
  visitNight: { min: 499, max: 716, description: "ביקור לילה" },
  visitWeekend: { min: 500, max: 685, description: "ביקור שבת/חג" },
  
  // Installation
  lightFixture: { min: 255, max: 354, description: "גוף תאורה צמוד תקרה" },
  additionalLight: { min: 148, max: 237, description: "גוף תאורה נוסף" },
  ceilingFan: { min: 355, max: 469, description: "מאוורר תקרה (ללא הרכבה)" },
  twoCeilingFans: { min: 580, max: 751, description: "2 מאווררים" },
  newOutlet: { min: 513, max: 838, description: "נקודת חשמל חדשה (עד 3 מ')" },
  threePhaseOutlet: { min: 586, max: 1001, description: "שקע תלת פאזי לכיריים" },
  sabbathClock: { min: 394, max: 529, description: "שעון שבת" },
  
  // Panels
  singlePhasePanel: { min: 1200, max: 1800, description: "לוח חד פאזי" },
  threePhasePanel: { min: 2000, max: 2900, description: "לוח תלת פאזי" },
  threePhaseUpgrade: { min: 3000, max: 5000, description: "מעבר לתלת פאזי" },
  rccd: { min: 400, max: 550, description: "ממסר פחת" },
  
  // AC/Power
  acOutlet: { min: 700, max: 850, description: "נקודת שקע למזגן" },
  boilerOutlet: { min: 700, max: 700, description: "נקודת חשמל לדוד" },
  threePhaseOutletPower: { min: 800, max: 1200, description: "שקע תלת פאזי" },
  evCharger: { min: 2700, max: 4365, description: "עמדת טעינה לרכב" },
} as const;

// =============================================================================
// PLUMBING COSTS
// =============================================================================

export const PLUMBING_PRICES = {
  visit: { min: 260, max: 338, description: "ביקור לבדיקה" },
  visitWeekend: { min: 458, max: 621, description: "ביקור סוף שבוע" },
  
  // Blockages
  kitchenBlockage: { min: 344, max: 485, description: "פתיחת סתימה במטבח" },
  kitchenBlockageElectric: { min: 410, max: 615, description: "סתימה עם ספירלה חשמלית" },
  toiletBlockage: { min: 379, max: 566, description: "פתיחת סתימה בשירותים" },
  sewerBlockage: { min: 497, max: 792, description: "סתימה בקו ביוב" },
  
  // Faucets & Fixtures
  faucetReplacement: { min: 306, max: 414, description: "החלפת ברז (ללא הברז)" },
  faucetReplacementDifficult: { min: 373, max: 534, description: "החלפת ברז גישה קשה" },
  faucetWithMaterial: { min: 541, max: 708, description: "החלפת ברז כולל חומר" },
  
  // Water points
  waterPoint: { min: 800, max: 1500, description: "נקודת מים (חם/קר/ביוב)" },
  pipeReplacement: { min: 1800, max: 2500, description: "החלפת צנרת לנקודה" },
  dishwasherPrep: { min: 362, max: 794, description: "הכנה למדיח כלים" },
  
  // Toilet
  hangingToiletInstall: { min: 3500, max: 4300, description: "אסלה תלויה + ניאגרה סמויה + ציפוי" },
  interputz4way: { min: 2000, max: 3000, description: "אינטרפוץ 4 דרך לאמבטיה" },
  drainChannel: { min: 1100, max: 1200, description: "תעלת ניקוז לאמבטיה" },
} as const;

// =============================================================================
// DRYWALL / GYPSUM COSTS
// =============================================================================

export const DRYWALL_PRICES = {
  // Per square meter
  wall: { min: 180, max: 250, description: "קיר גבס" },
  ceilingDrop: { min: 200, max: 500, description: "הנמכת תקרה" },
  acousticCeiling: { min: 180, max: 300, description: "תקרה אקוסטית" },
  cornice: { min: 200, max: 300, description: "קרניז גבס" },
  shelf: { min: 70, max: 70, description: "מדף גבס" },
  
  // Units
  tvUnit: { min: 3500, max: 7000, description: "מזנון גבס" },
} as const;

// =============================================================================
// ALUMINUM & WINDOWS COSTS
// =============================================================================

export const ALUMINUM_PRICES = {
  // Per square meter
  aluminumWindows: { min: 1200, max: 4500, description: "חלונות אלומיניום" },
  balconyEnclosure: { min: 1000, max: 2000, description: "סגירת מרפסת (חלונות+תריסים)" },
  belgianBalcony: { min: 1100, max: 2000, description: "סגירת מרפסת בלגית" },
  
  // Showcase/Vitrine
  vitrine7000: { min: 650, max: 800, description: "ויטרינה פרופיל 7000" },
  vitrineExtel: { min: 550, max: 650, description: "ויטרינה פרופיל אקסטל" },
  vitrineBelgian7300: { min: 1000, max: 1500, description: "ויטרינה בלגי 7300" },
  vitrineBelgian4300: { min: 1100, max: 1500, description: "ויטרינה בלגי 4300" },
  
  // Per unit
  aluminumScreen: { min: 250, max: 350, description: "רשת אלומיניום לחלון" },
  rollerScreenMamad: { min: 500, max: 650, description: "רשת גלילה לממ\"ד" },
  shutter3sqm: { min: 1500, max: 1600, description: "תריס לחלון 3 מ\"ר" },
  electricShutterMotor: { min: 600, max: 2800, description: "מנוע לתריס חשמלי" },
  slidingScreen: { min: 2000, max: 2600, description: "רשת הזזה לסלון 2x2.5" },
  laundryEnclosure: { min: 500, max: 1500, description: "מסתור כביסה" },
} as const;

// =============================================================================
// PAINTING COSTS
// =============================================================================

export const PAINTING_PRICES = {
  // Per unit
  singleWall: { min: 300, max: 600, description: "קיר בודד" },
  bathroom: { min: 800, max: 1500, description: "חדר אמבטיה + תקרה" },
  kitchen: { min: 800, max: 1050, description: "מטבח + תקרה" },
  oneRoom: { min: 1000, max: 1500, description: "חדר אחד + תקרה" },
  
  // By apartment size
  twoRooms: { min: 2500, max: 3000, description: "דירת 2 חדרים" },
  threeRooms: { min: 4000, max: 4500, description: "דירת 3 חדרים" },
  fourRooms: { min: 5000, max: 6000, description: "דירת 4 חדרים" },
  fiveRooms: { min: 6000, max: 7000, description: "דירת 5 חדרים" },
  
  // Per sqm (exterior)
  exteriorAcrylic: { min: 60, max: 70, description: "קירות חיצוניים - אקרילי" },
  exteriorTexture: { min: 150, max: 170, description: "קירות חיצוניים - שליכט" },
} as const;

// =============================================================================
// WATERPROOFING / SEALING COSTS
// =============================================================================

export const WATERPROOFING_PRICES = {
  // Per square meter
  balconyBitumen: { min: 700, max: 1000, description: "איטום מרפסת ביריעות (ללא ריצוף)" },
  roofBitumen: { min: 110, max: 130, description: "איטום גג ביריעות" },
  roofTar: { min: 50, max: 65, description: "איטום גג בזפת" },
  wallExterior: { min: 100, max: 200, description: "איטום קיר טיח חיצוני" },
  
  // Per unit
  wallMoisture: { min: 1500, max: 2000, description: "איטום רטיבות בקיר" },
  windowSeal: { min: 500, max: 700, description: "איטום חלון" },
} as const;

// =============================================================================
// LOCATION MULTIPLIERS
// =============================================================================

export const LOCATION_MULTIPLIERS = {
  "תל אביב": 1.25,
  "מרכז": 1.0,
  "שרון/שפלה": 0.95,
  "חיפה/צפון": 0.85,
  "דרום": 0.80,
  "ירושלים": 1.15,
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the average price from a price range
 */
export function getAveragePrice(priceRange: { min: number; max: number }): number {
  return Math.round((priceRange.min + priceRange.max) / 2);
}

/**
 * Apply location multiplier to a price
 */
export function applyLocationMultiplier(price: number, location: keyof typeof LOCATION_MULTIPLIERS): number {
  const multiplier = LOCATION_MULTIPLIERS[location] || 1.0;
  return Math.round(price * multiplier);
}

/**
 * Format price in ILS
 */
export function formatPrice(price: number): string {
  return `₪${price.toLocaleString('he-IL')}`;
}

/**
 * Format price range
 */
export function formatPriceRange(range: { min: number; max: number }): string {
  return `₪${range.min.toLocaleString('he-IL')} - ₪${range.max.toLocaleString('he-IL')}`;
}

/**
 * Get Midrag pricing reference for AI prompts
 * Returns a formatted string with all pricing data for comparison
 */
export function getMidragPricingReference(): string {
  return `
מחירי שוק מתוך מידרג (Midrag.co.il) - 2,837,136 ביקורות על 11,705 בעלי מקצוע:

=== שיפוץ כללי (מחיר למ"ר) ===
• קוסמטי (צביעה, תיקונים קטנים): ₪450-700
• שיפוץ קומפלט: ₪1,400-2,000
• יוקרתי: ₪3,000-4,000

=== חדר אמבטיה ===
• תקציב נמוך: ₪16,000-25,000
• סטנדרטי: ₪25,000-32,000
• יוקרתי: ₪32,000-45,000
פירוט: פירוק ₪4,500-6,500 | צנרת 6 נקודות ₪9,600-11,000 | ריצוף 7 מ"ר ₪1,300-1,700 | חיפוי קירות 28 מ"ר ₪4,500-6,000 | איטום ₪2,000-3,000

=== מטבח ===
• חידוש (דלתות/פרזול): ₪5,000-15,000
• מטבח חדש סטנדרטי: ₪35,000-50,000
• יוקרתי: ₪70,000-100,000
דלתות: פורמייקה ₪200-500/יח' | פולימר ₪400-700/יח' | זכוכית ₪400-800/יח'

=== ריצוף (למ"ר) ===
• קרמיקה 80x80 כולל פירוק: ₪450-700
• הדבקת ריצוף: ₪190-250
• פרקט למינציה: ₪90-200
• פרקט עץ גושני: ₪338-620
• אבן טבעית חוץ: ₪250-350

=== חשמל ===
• ביקור לבדיקה: ₪289-377
• גוף תאורה צמוד תקרה: ₪255-354
• נקודת חשמל חדשה (עד 3 מ'): ₪513-838
• שקע תלת פאזי לכיריים: ₪586-1,001
• לוח חד פאזי: ₪1,200-1,800
• לוח תלת פאזי: ₪2,000-2,900
• מעבר לתלת פאזי: ₪3,000-5,000
• נקודה למזגן: ₪700-850
• עמדת טעינה לרכב: ₪2,700-4,365

=== אינסטלציה ===
• ביקור: ₪260-338
• פתיחת סתימה מטבח: ₪344-485
• סתימה בשירותים: ₪379-566
• החלפת ברז (ללא הברז): ₪306-414
• נקודת מים (חם/קר/ביוב): ₪800-1,500
• אסלה תלויה + ניאגרה סמויה: ₪3,500-4,300

=== גבס (למ"ר) ===
• קיר גבס: ₪180-250
• הנמכת תקרה: ₪200-500
• תקרה אקוסטית: ₪180-300
• מזנון גבס: ₪3,500-7,000

=== אלומיניום ===
• חלונות (למ"ר): ₪1,200-4,500
• סגירת מרפסת: ₪1,000-2,000/מ"ר
• רשת לחלון: ₪250-350/יח'
• תריס 3 מ"ר: ₪1,500-1,600
• מנוע לתריס חשמלי: ₪600-2,800

=== צביעה ===
• קיר בודד: ₪300-600
• חדר אמבטיה + תקרה: ₪800-1,500
• מטבח + תקרה: ₪800-1,050
• דירת 2 חדרים: ₪2,500-3,000
• דירת 3 חדרים: ₪4,000-4,500
• דירת 4 חדרים: ₪5,000-6,000
• דירת 5 חדרים: ₪6,000-7,000

=== איטום (למ"ר) ===
• מרפסת ביריעות: ₪700-1,000
• גג ביריעות: ₪110-130
• גג בזפת: ₪50-65
• קיר חיצוני: ₪100-200

=== מכפילי מיקום ===
תל אביב: x1.25 | ירושלים: x1.15 | מרכז: x1.0 | שרון/שפלה: x0.95 | חיפה/צפון: x0.85 | דרום: x0.80
`.trim();
}
