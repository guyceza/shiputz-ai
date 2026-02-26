/**
 * מחשבון חומרים מקצועי - ShiputzAI
 * חישובים מדויקים לפי תקני הבנייה והשיפוצים בישראל
 */

// ===== טייפים ואינטרפייסים =====

/** תבניות הנחה לאריחים */
export type TilePattern = 'straight' | 'brick' | 'diagonal' | 'herringbone';

/** סוגי דבק לאריחים */
export type AdhesiveType = 'regular' | 'flexible' | 'natural_stone' | 'large_format';

/** סוגי צבע */
export type PaintType = 'plastic' | 'acrylic' | 'silicate';

/** סוגי משטח */
export type SurfaceType = 'smooth' | 'textured' | 'rough' | 'porous';

/** רמת מורכבות החדר */
export type RoomComplexity = 'simple' | 'medium' | 'complex';

/** כיוון הנחת פרקט */
export type FlooringDirection = 'parallel' | 'diagonal' | 'herringbone';

// ===== קלטים =====

export interface TileInput {
  /** שטח החדר במ"ר */
  roomArea: number;
  /** אורך אריח בס"מ */
  tileLength: number;
  /** רוחב אריח בס"מ */
  tileWidth: number;
  /** תבנית הנחה */
  pattern?: TilePattern;
  /** רמת מורכבות החדר */
  complexity?: RoomComplexity;
  /** כמות אריחים בקופסה */
  tilesPerBox?: number;
  /** שטח בקופסה במ"ר (אם ידוע) */
  sqmPerBox?: number;
  /** אחוז בזבוז נוסף ידני */
  extraWastePercent?: number;
}

export interface AdhesiveInput {
  /** שטח לכיסוי במ"ר */
  area: number;
  /** אורך אריח בס"מ */
  tileLength: number;
  /** רוחב אריח בס"מ */
  tileWidth: number;
  /** סוג דבק */
  adhesiveType?: AdhesiveType;
  /** האם המשטח לא ישר */
  unevenSurface?: boolean;
  /** משקל שק דבק בק"ג */
  bagWeightKg?: number;
}

export interface GroutInput {
  /** שטח לכיסוי במ"ר */
  area: number;
  /** אורך אריח בס"מ */
  tileLength: number;
  /** רוחב אריח בס"מ */
  tileWidth: number;
  /** רוחב מרווח במ"מ */
  jointWidth?: number;
  /** עומק מרווח במ"מ (בד"כ כעובי האריח) */
  jointDepth?: number;
  /** משקל שק רובה בק"ג */
  bagWeightKg?: number;
}

export interface PaintInput {
  /** אורך החדר במטרים */
  roomLength: number;
  /** רוחב החדר במטרים */
  roomWidth: number;
  /** גובה החדר במטרים */
  roomHeight: number;
  /** סוג צבע */
  paintType?: PaintType;
  /** מספר שכבות */
  coats?: number;
  /** האם לכלול תקרה */
  includeCeiling?: boolean;
  /** שטח פתחים (חלונות, דלתות) במ"ר */
  openingsArea?: number;
  /** גודל פחית צבע בליטרים */
  canSizeLiters?: number;
  /** האם צריך פריימר */
  includePrimer?: boolean;
  /** סוג משטח */
  surfaceType?: SurfaceType;
}

export interface PlasterInput {
  /** שטח לכיסוי במ"ר */
  area: number;
  /** עובי שכבה במ"מ */
  thicknessMm?: number;
  /** משקל שק בק"ג */
  bagWeightKg?: number;
}

export interface SpackelInput {
  /** שטח לכיסוי במ"ר */
  area: number;
  /** מספר שכבות */
  coats?: number;
  /** משקל שק/דלי בק"ג */
  containerWeightKg?: number;
}

export interface FlooringInput {
  /** שטח החדר במ"ר */
  roomArea: number;
  /** כיוון הנחה */
  direction?: FlooringDirection;
  /** רמת מורכבות החדר */
  complexity?: RoomComplexity;
  /** שטח בקופסה במ"ר */
  sqmPerBox?: number;
}

export interface FullMaterialsInput {
  /** אורך החדר במטרים */
  roomLength: number;
  /** רוחב החדר במטרים */
  roomWidth: number;
  /** גובה החדר במטרים */
  roomHeight?: number;
  /** האם לחשב אריחי רצפה */
  calculateFloorTiles?: boolean;
  /** האם לחשב אריחי קיר */
  calculateWallTiles?: boolean;
  /** האם לחשב צבע */
  calculatePaint?: boolean;
  /** האם לחשב פרקט */
  calculateFlooring?: boolean;
  /** פרמטרים לאריחים */
  tileParams?: Partial<TileInput>;
  /** פרמטרים לצבע */
  paintParams?: Partial<PaintInput>;
  /** פרמטרים לפרקט */
  flooringParams?: Partial<FlooringInput>;
}

// ===== תוצאות =====

export interface TileResult {
  /** כמות אריחים נדרשת */
  quantity: number;
  /** כמות קופסאות */
  boxes: number;
  /** שטח נטו במ"ר */
  netSqm: number;
  /** שטח כולל עם בזבוז במ"ר */
  totalSqm: number;
  /** אחוז בזבוז */
  wastePercent: number;
  /** כמות בזבוז באריחים */
  wasteQuantity: number;
  /** פירוט */
  breakdown: {
    baseQuantity: number;
    patternMultiplier: number;
    sizeWastePercent: number;
    complexityWastePercent: number;
    extraWastePercent: number;
  };
}

export interface AdhesiveResult {
  /** כמות בק"ג */
  kg: number;
  /** כמות שקים */
  bags: number;
  /** כיסוי לק"ג */
  coveragePerKg: number;
  /** פירוט */
  breakdown: {
    baseConsumption: number;
    unevenSurfaceMultiplier: number;
    adhesiveTypeMultiplier: number;
  };
}

export interface GroutResult {
  /** כמות בק"ג */
  kg: number;
  /** כמות שקים */
  bags: number;
  /** פירוט */
  breakdown: {
    jointVolume: number;
    groutDensity: number;
    wastePercent: number;
  };
}

export interface PaintResult {
  /** כמות בליטרים */
  liters: number;
  /** כמות פחיות */
  cans: number;
  /** מספר שכבות */
  coats: number;
  /** שטח קירות במ"ר */
  wallArea: number;
  /** שטח תקרה במ"ר */
  ceilingArea: number;
  /** שטח כולל במ"ר */
  totalArea: number;
  /** פריימר */
  primer?: {
    liters: number;
    cans: number;
  };
  /** פירוט */
  breakdown: {
    grossWallArea: number;
    openingsDeducted: number;
    coveragePerLiter: number;
    surfaceMultiplier: number;
  };
}

export interface PlasterResult {
  /** כמות בק"ג */
  kg: number;
  /** כמות שקים */
  bags: number;
  /** פירוט */
  breakdown: {
    consumptionPerSqmPerCm: number;
    thicknessCm: number;
    wastePercent: number;
  };
}

export interface SpackelResult {
  /** כמות בק"ג */
  kg: number;
  /** כמות מכלים */
  containers: number;
  /** פירוט */
  breakdown: {
    consumptionPerSqm: number;
    coats: number;
    wastePercent: number;
  };
}

export interface FlooringResult {
  /** שטח נדרש במ"ר */
  sqm: number;
  /** כמות קופסאות */
  boxes: number;
  /** אחוז בזבוז */
  wastePercent: number;
  /** פירוט */
  breakdown: {
    netArea: number;
    directionMultiplier: number;
    complexityWaste: number;
  };
}

export interface FullMaterialsResult {
  /** שטח רצפה במ"ר */
  floorArea: number;
  /** שטח קירות במ"ר */
  wallArea?: number;
  /** אריחי רצפה */
  floorTiles?: TileResult;
  /** דבק לרצפה */
  floorAdhesive?: AdhesiveResult;
  /** רובה לרצפה */
  floorGrout?: GroutResult;
  /** אריחי קיר */
  wallTiles?: TileResult;
  /** דבק לקירות */
  wallAdhesive?: AdhesiveResult;
  /** רובה לקירות */
  wallGrout?: GroutResult;
  /** צבע */
  paint?: PaintResult;
  /** פרקט/למינציה */
  flooring?: FlooringResult;
}

// ===== קבועים =====

/** מכפילי תבנית לאריחים */
const PATTERN_MULTIPLIERS: Record<TilePattern, number> = {
  straight: 1.0,
  brick: 1.05,
  diagonal: 1.15,
  herringbone: 1.20,
};

/** אחוזי בזבוז לפי מורכבות חדר */
const COMPLEXITY_WASTE: Record<RoomComplexity, number> = {
  simple: 0.10,
  medium: 0.12,
  complex: 0.15,
};

/** צריכת דבק בסיסית לפי גודל אריח (ק"ג/מ"ר) */
function getBaseAdhesiveConsumption(tileArea: number): number {
  // שטח אריח בסמ"ר
  if (tileArea <= 900) return 4.5;      // עד 30x30
  if (tileArea <= 1800) return 5.5;     // עד 30x60
  if (tileArea <= 3600) return 7;       // עד 60x60
  return 8;                              // מעל 60x60
}

/** מכפילי סוג דבק */
const ADHESIVE_TYPE_MULTIPLIERS: Record<AdhesiveType, number> = {
  regular: 1.0,
  flexible: 1.1,
  natural_stone: 1.15,
  large_format: 1.2,
};

/** כיסוי צבע לפי סוג (מ"ר/ליטר) */
const PAINT_COVERAGE: Record<PaintType, number> = {
  plastic: 13,    // 12-14
  acrylic: 11,    // 10-12
  silicate: 9,    // 8-10
};

/** מכפילי משטח לצבע */
const SURFACE_MULTIPLIERS: Record<SurfaceType, number> = {
  smooth: 1.0,
  textured: 1.15,
  rough: 1.25,
  porous: 1.35,
};

/** מכפילי כיוון הנחה לפרקט */
const FLOORING_DIRECTION_MULTIPLIERS: Record<FlooringDirection, number> = {
  parallel: 1.05,
  diagonal: 1.12,
  herringbone: 1.18,
};

/** צפיפות רובה (ק"ג/ליטר) */
const GROUT_DENSITY = 1.6;

// ===== פונקציות עזר =====

/**
 * ולידציה של מספר חיובי
 */
function validatePositive(value: number, name: string): void {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    throw new Error(`${name} חייב להיות מספר חיובי`);
  }
}

/**
 * ולידציה של מספר לא שלילי
 */
function validateNonNegative(value: number, name: string): void {
  if (typeof value !== 'number' || isNaN(value) || value < 0) {
    throw new Error(`${name} חייב להיות מספר לא שלילי`);
  }
}

/**
 * עיגול למעלה למספר שלם
 */
function roundUp(value: number): number {
  return Math.ceil(value);
}

/**
 * עיגול לשתי ספרות אחרי הנקודה
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ===== פונקציות חישוב =====

/**
 * חישוב אריחים
 * נוסחה: (שטח_חדר / שטח_אריח) × מכפיל_תבנית × (1 + אחוז_בזבוז)
 */
export function calculateTiles(input: TileInput): TileResult {
  // ולידציה
  validatePositive(input.roomArea, 'שטח החדר');
  validatePositive(input.tileLength, 'אורך אריח');
  validatePositive(input.tileWidth, 'רוחב אריח');

  // ערכי ברירת מחדל
  const pattern = input.pattern || 'straight';
  const complexity = input.complexity || 'simple';
  const extraWaste = input.extraWastePercent || 0;

  // חישוב שטח אריח בודד (ס"מ -> מ"ר)
  const tileAreaSqm = (input.tileLength * input.tileWidth) / 10000;

  // כמות בסיסית של אריחים
  const baseQuantity = input.roomArea / tileAreaSqm;

  // מכפיל תבנית
  const patternMultiplier = PATTERN_MULTIPLIERS[pattern];

  // אחוז בזבוז לפי גודל אריח (אריחים גדולים = יותר בזבוז)
  const tileAreaSqCm = input.tileLength * input.tileWidth;
  let sizeWastePercent = 0;
  if (tileAreaSqCm > 3600) sizeWastePercent = 0.03;      // 60x60+
  else if (tileAreaSqCm > 1800) sizeWastePercent = 0.02; // 30x60+
  else if (tileAreaSqCm > 900) sizeWastePercent = 0.01;  // 30x30+

  // אחוז בזבוז לפי מורכבות
  const complexityWastePercent = COMPLEXITY_WASTE[complexity];

  // סה"כ בזבוז
  const totalWastePercent = sizeWastePercent + complexityWastePercent + (extraWaste / 100);

  // כמות סופית
  const totalQuantity = baseQuantity * patternMultiplier * (1 + totalWastePercent);
  const finalQuantity = roundUp(totalQuantity);

  // חישוב קופסאות
  let boxes: number;
  if (input.sqmPerBox) {
    boxes = roundUp((finalQuantity * tileAreaSqm) / input.sqmPerBox);
  } else if (input.tilesPerBox) {
    boxes = roundUp(finalQuantity / input.tilesPerBox);
  } else {
    // ברירת מחדל: קופסה של 1 מ"ר
    boxes = roundUp(finalQuantity * tileAreaSqm);
  }

  const wasteQuantity = finalQuantity - roundUp(baseQuantity);

  return {
    quantity: finalQuantity,
    boxes,
    netSqm: round2(input.roomArea),
    totalSqm: round2(finalQuantity * tileAreaSqm),
    wastePercent: round2(totalWastePercent * 100),
    wasteQuantity: wasteQuantity,
    breakdown: {
      baseQuantity: round2(baseQuantity),
      patternMultiplier,
      sizeWastePercent: round2(sizeWastePercent * 100),
      complexityWastePercent: round2(complexityWastePercent * 100),
      extraWastePercent: extraWaste,
    },
  };
}

/**
 * חישוב דבק לאריחים
 */
export function calculateAdhesive(input: AdhesiveInput): AdhesiveResult {
  // ולידציה
  validatePositive(input.area, 'שטח');
  validatePositive(input.tileLength, 'אורך אריח');
  validatePositive(input.tileWidth, 'רוחב אריח');

  // ערכי ברירת מחדל
  const adhesiveType = input.adhesiveType || 'regular';
  const bagWeight = input.bagWeightKg || 25; // שק סטנדרטי 25 ק"ג
  const unevenSurface = input.unevenSurface || false;

  // חישוב צריכה בסיסית
  const tileArea = input.tileLength * input.tileWidth;
  const baseConsumption = getBaseAdhesiveConsumption(tileArea);

  // מכפילים
  const unevenMultiplier = unevenSurface ? 1.2 : 1.0;
  const typeMultiplier = ADHESIVE_TYPE_MULTIPLIERS[adhesiveType];

  // סה"כ
  const totalKg = input.area * baseConsumption * unevenMultiplier * typeMultiplier;
  const bags = roundUp(totalKg / bagWeight);

  return {
    kg: round2(totalKg),
    bags,
    coveragePerKg: round2(input.area / totalKg),
    breakdown: {
      baseConsumption,
      unevenSurfaceMultiplier: unevenMultiplier,
      adhesiveTypeMultiplier: typeMultiplier,
    },
  };
}

/**
 * חישוב רובה (grout)
 * נוסחה: [(אורך + רוחב) / (אורך × רוחב)] × רוחב_מרווח × עומק × צפיפות × שטח × 1.1
 */
export function calculateGrout(input: GroutInput): GroutResult {
  // ולידציה
  validatePositive(input.area, 'שטח');
  validatePositive(input.tileLength, 'אורך אריח');
  validatePositive(input.tileWidth, 'רוחב אריח');

  // ערכי ברירת מחדל
  const jointWidth = input.jointWidth || 3; // מ"מ
  const jointDepth = input.jointDepth || 8; // מ"מ (עובי אריח טיפוסי)
  const bagWeight = input.bagWeightKg || 5; // שק רובה סטנדרטי

  // המרה לס"מ לנוסחה
  const tileLengthCm = input.tileLength;
  const tileWidthCm = input.tileWidth;
  const jointWidthCm = jointWidth / 10;
  const jointDepthCm = jointDepth / 10;

  // נוסחה מקצועית לחישוב נפח מרווחים
  // [(L + W) / (L × W)] × joint_width × joint_depth × density × area
  const jointFactor = (tileLengthCm + tileWidthCm) / (tileLengthCm * tileWidthCm);
  const jointVolume = jointFactor * jointWidthCm * jointDepthCm;

  // ק"ג רובה למ"ר (כולל צפיפות)
  const kgPerSqm = jointVolume * GROUT_DENSITY * 1000; // המרה ליחידות נכונות

  // סה"כ עם 10% בזבוז
  const wastePercent = 0.10;
  const totalKg = input.area * kgPerSqm * (1 + wastePercent);
  const bags = roundUp(totalKg / bagWeight);

  return {
    kg: round2(totalKg),
    bags,
    breakdown: {
      jointVolume: round2(jointVolume),
      groutDensity: GROUT_DENSITY,
      wastePercent: wastePercent * 100,
    },
  };
}

/**
 * חישוב צבע
 */
export function calculatePaint(input: PaintInput): PaintResult {
  // ולידציה
  validatePositive(input.roomLength, 'אורך החדר');
  validatePositive(input.roomWidth, 'רוחב החדר');
  validatePositive(input.roomHeight, 'גובה החדר');

  // ערכי ברירת מחדל
  const paintType = input.paintType || 'plastic';
  const coats = input.coats || 2;
  const includeCeiling = input.includeCeiling ?? true;
  const openingsArea = input.openingsArea || 0;
  const canSize = input.canSizeLiters || 18; // פח סטנדרטי
  const includePrimer = input.includePrimer ?? false;
  const surfaceType = input.surfaceType || 'smooth';

  validateNonNegative(openingsArea, 'שטח פתחים');

  // חישוב שטח קירות
  const perimeter = 2 * (input.roomLength + input.roomWidth);
  const grossWallArea = perimeter * input.roomHeight;
  const netWallArea = Math.max(0, grossWallArea - openingsArea);

  // חישוב שטח תקרה
  const ceilingArea = includeCeiling ? input.roomLength * input.roomWidth : 0;

  // סה"כ שטח
  const totalArea = netWallArea + ceilingArea;

  // כיסוי לפי סוג צבע
  const baseCoverage = PAINT_COVERAGE[paintType];

  // מכפיל משטח
  const surfaceMultiplier = SURFACE_MULTIPLIERS[surfaceType];

  // כיסוי בפועל
  const effectiveCoverage = baseCoverage / surfaceMultiplier;

  // חישוב ליטרים
  const litersPerCoat = totalArea / effectiveCoverage;
  const totalLiters = litersPerCoat * coats;
  const cans = roundUp(totalLiters / canSize);

  // פריימר
  let primer: { liters: number; cans: number } | undefined;
  if (includePrimer) {
    const primerLiters = totalArea / (baseCoverage * 1.1); // פריימר מכסה קצת יותר
    primer = {
      liters: round2(primerLiters),
      cans: roundUp(primerLiters / canSize),
    };
  }

  return {
    liters: round2(totalLiters),
    cans,
    coats,
    wallArea: round2(netWallArea),
    ceilingArea: round2(ceilingArea),
    totalArea: round2(totalArea),
    primer,
    breakdown: {
      grossWallArea: round2(grossWallArea),
      openingsDeducted: round2(openingsArea),
      coveragePerLiter: round2(effectiveCoverage),
      surfaceMultiplier,
    },
  };
}

/**
 * חישוב טיח
 */
export function calculatePlaster(input: PlasterInput): PlasterResult {
  // ולידציה
  validatePositive(input.area, 'שטח');

  // ערכי ברירת מחדל
  const thicknessMm = input.thicknessMm || 10; // ס"מ אחד
  const bagWeight = input.bagWeightKg || 25;

  // צריכה: 17.5 ק"ג/מ"ר/ס"מ (ממוצע 15-20)
  const consumptionPerSqmPerCm = 17.5;
  const thicknessCm = thicknessMm / 10;
  const wastePercent = 0.10;

  const baseKg = input.area * consumptionPerSqmPerCm * thicknessCm;
  const totalKg = baseKg * (1 + wastePercent);
  const bags = roundUp(totalKg / bagWeight);

  return {
    kg: round2(totalKg),
    bags,
    breakdown: {
      consumptionPerSqmPerCm,
      thicknessCm,
      wastePercent: wastePercent * 100,
    },
  };
}

/**
 * חישוב שפכטל
 */
export function calculateSpackel(input: SpackelInput): SpackelResult {
  // ולידציה
  validatePositive(input.area, 'שטח');

  // ערכי ברירת מחדל
  const coats = input.coats || 2;
  const containerWeight = input.containerWeightKg || 25;

  // צריכה: 1.25 ק"ג/מ"ר/שכבה (ממוצע 1-1.5)
  const consumptionPerSqm = 1.25;
  const wastePercent = 0.10;

  const baseKg = input.area * consumptionPerSqm * coats;
  const totalKg = baseKg * (1 + wastePercent);
  const containers = roundUp(totalKg / containerWeight);

  return {
    kg: round2(totalKg),
    containers,
    breakdown: {
      consumptionPerSqm,
      coats,
      wastePercent: wastePercent * 100,
    },
  };
}

/**
 * חישוב פרקט/למינציה
 */
export function calculateFlooring(input: FlooringInput): FlooringResult {
  // ולידציה
  validatePositive(input.roomArea, 'שטח החדר');

  // ערכי ברירת מחדל
  const direction = input.direction || 'parallel';
  const complexity = input.complexity || 'simple';
  const sqmPerBox = input.sqmPerBox || 2.4; // קופסה סטנדרטית

  // מכפיל כיוון
  const directionMultiplier = FLOORING_DIRECTION_MULTIPLIERS[direction];

  // בזבוז לפי מורכבות (פרקט יותר סלחני מאריחים)
  const complexityWaste: Record<RoomComplexity, number> = {
    simple: 0.05,
    medium: 0.07,
    complex: 0.10,
  };
  const complexityWastePercent = complexityWaste[complexity];

  // חישוב
  const totalSqm = input.roomArea * directionMultiplier * (1 + complexityWastePercent);
  const boxes = roundUp(totalSqm / sqmPerBox);
  const wastePercent = ((totalSqm / input.roomArea) - 1) * 100;

  return {
    sqm: round2(totalSqm),
    boxes,
    wastePercent: round2(wastePercent),
    breakdown: {
      netArea: round2(input.roomArea),
      directionMultiplier,
      complexityWaste: round2(complexityWastePercent * 100),
    },
  };
}

/**
 * חישוב כל החומרים לפרויקט
 */
export function calculateAllMaterials(input: FullMaterialsInput): FullMaterialsResult {
  // ולידציה בסיסית
  validatePositive(input.roomLength, 'אורך החדר');
  validatePositive(input.roomWidth, 'רוחב החדר');

  const floorArea = input.roomLength * input.roomWidth;
  const height = input.roomHeight || 2.7; // גובה ברירת מחדל

  const result: FullMaterialsResult = {
    floorArea: round2(floorArea),
  };

  // חישוב שטח קירות אם יש גובה
  if (input.roomHeight) {
    const perimeter = 2 * (input.roomLength + input.roomWidth);
    result.wallArea = round2(perimeter * input.roomHeight);
  }

  // אריחי רצפה
  if (input.calculateFloorTiles) {
    const tileParams = input.tileParams || {};
    const tileInput: TileInput = {
      roomArea: floorArea,
      tileLength: tileParams.tileLength || 60, // ברירת מחדל 60x60
      tileWidth: tileParams.tileWidth || 60,
      pattern: tileParams.pattern || 'straight',
      complexity: tileParams.complexity || 'simple',
      tilesPerBox: tileParams.tilesPerBox,
      sqmPerBox: tileParams.sqmPerBox,
      extraWastePercent: tileParams.extraWastePercent,
    };

    result.floorTiles = calculateTiles(tileInput);

    // דבק לרצפה
    result.floorAdhesive = calculateAdhesive({
      area: floorArea,
      tileLength: tileInput.tileLength,
      tileWidth: tileInput.tileWidth,
    });

    // רובה לרצפה
    result.floorGrout = calculateGrout({
      area: floorArea,
      tileLength: tileInput.tileLength,
      tileWidth: tileInput.tileWidth,
    });
  }

  // אריחי קיר
  if (input.calculateWallTiles && result.wallArea) {
    const tileParams = input.tileParams || {};
    const tileInput: TileInput = {
      roomArea: result.wallArea,
      tileLength: tileParams.tileLength || 30, // ברירת מחדל 30x60 לקירות
      tileWidth: tileParams.tileWidth || 60,
      pattern: tileParams.pattern || 'brick',
      complexity: tileParams.complexity || 'simple',
      tilesPerBox: tileParams.tilesPerBox,
      sqmPerBox: tileParams.sqmPerBox,
      extraWastePercent: tileParams.extraWastePercent,
    };

    result.wallTiles = calculateTiles(tileInput);

    // דבק לקירות
    result.wallAdhesive = calculateAdhesive({
      area: result.wallArea,
      tileLength: tileInput.tileLength,
      tileWidth: tileInput.tileWidth,
    });

    // רובה לקירות
    result.wallGrout = calculateGrout({
      area: result.wallArea,
      tileLength: tileInput.tileLength,
      tileWidth: tileInput.tileWidth,
    });
  }

  // צבע
  if (input.calculatePaint) {
    const paintParams = input.paintParams || {};
    result.paint = calculatePaint({
      roomLength: input.roomLength,
      roomWidth: input.roomWidth,
      roomHeight: height,
      paintType: paintParams.paintType,
      coats: paintParams.coats,
      includeCeiling: paintParams.includeCeiling,
      openingsArea: paintParams.openingsArea,
      canSizeLiters: paintParams.canSizeLiters,
      includePrimer: paintParams.includePrimer,
      surfaceType: paintParams.surfaceType,
    });
  }

  // פרקט/למינציה
  if (input.calculateFlooring) {
    const flooringParams = input.flooringParams || {};
    result.flooring = calculateFlooring({
      roomArea: floorArea,
      direction: flooringParams.direction,
      complexity: flooringParams.complexity,
      sqmPerBox: flooringParams.sqmPerBox,
    });
  }

  return result;
}

// ===== ייצוא ברירות מחדל =====

export const DEFAULT_VALUES = {
  tileSize: { length: 60, width: 60 },
  wallTileSize: { length: 30, width: 60 },
  roomHeight: 2.7,
  adhesiveBagWeight: 25,
  groutBagWeight: 5,
  paintCanSize: 18,
  flooringSqmPerBox: 2.4,
  jointWidth: 3,
  jointDepth: 8,
  plasterThickness: 10,
  spackelCoats: 2,
  paintCoats: 2,
};

export const MULTIPLIERS = {
  pattern: PATTERN_MULTIPLIERS,
  adhesiveType: ADHESIVE_TYPE_MULTIPLIERS,
  paintCoverage: PAINT_COVERAGE,
  surface: SURFACE_MULTIPLIERS,
  flooringDirection: FLOORING_DIRECTION_MULTIPLIERS,
  complexity: COMPLEXITY_WASTE,
};
