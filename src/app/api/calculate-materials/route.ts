/**
 * API Endpoint - מחשבון חומרים
 * POST /api/calculate-materials
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateTiles,
  calculateAdhesive,
  calculateGrout,
  calculatePaint,
  calculatePlaster,
  calculateSpackel,
  calculateFlooring,
  calculateAllMaterials,
  DEFAULT_VALUES,
  MULTIPLIERS,
  type TileInput,
  type AdhesiveInput,
  type GroutInput,
  type PaintInput,
  type PlasterInput,
  type SpackelInput,
  type FlooringInput,
  type FullMaterialsInput,
} from '@/lib/materials-calculator';

// סוגי חישוב אפשריים
type CalculationType = 
  | 'tiles' 
  | 'adhesive' 
  | 'grout' 
  | 'paint' 
  | 'plaster' 
  | 'spackel' 
  | 'flooring' 
  | 'all';

interface RequestBody {
  /** סוג החישוב */
  type: CalculationType;
  /** פרמטרים לחישוב */
  params: Record<string, unknown>;
}

/**
 * POST /api/calculate-materials
 * 
 * דוגמאות שימוש:
 * 
 * 1. חישוב אריחים:
 * {
 *   "type": "tiles",
 *   "params": {
 *     "roomArea": 20,
 *     "tileLength": 60,
 *     "tileWidth": 60,
 *     "pattern": "diagonal"
 *   }
 * }
 * 
 * 2. חישוב צבע:
 * {
 *   "type": "paint",
 *   "params": {
 *     "roomLength": 5,
 *     "roomWidth": 4,
 *     "roomHeight": 2.7,
 *     "paintType": "acrylic",
 *     "coats": 2
 *   }
 * }
 * 
 * 3. חישוב מלא:
 * {
 *   "type": "all",
 *   "params": {
 *     "roomLength": 5,
 *     "roomWidth": 4,
 *     "roomHeight": 2.7,
 *     "calculateFloorTiles": true,
 *     "calculatePaint": true
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // ולידציה בסיסית
    if (!body.type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'חסר סוג חישוב (type)',
          validTypes: ['tiles', 'adhesive', 'grout', 'paint', 'plaster', 'spackel', 'flooring', 'all']
        },
        { status: 400 }
      );
    }

    if (!body.params || typeof body.params !== 'object') {
      return NextResponse.json(
        { success: false, error: 'חסרים פרמטרים (params)' },
        { status: 400 }
      );
    }

    let result: unknown;

    switch (body.type) {
      case 'tiles':
        result = calculateTiles(body.params as unknown as TileInput);
        break;

      case 'adhesive':
        result = calculateAdhesive(body.params as unknown as AdhesiveInput);
        break;

      case 'grout':
        result = calculateGrout(body.params as unknown as GroutInput);
        break;

      case 'paint':
        result = calculatePaint(body.params as unknown as PaintInput);
        break;

      case 'plaster':
        result = calculatePlaster(body.params as unknown as PlasterInput);
        break;

      case 'spackel':
        result = calculateSpackel(body.params as unknown as SpackelInput);
        break;

      case 'flooring':
        result = calculateFlooring(body.params as unknown as FlooringInput);
        break;

      case 'all':
        result = calculateAllMaterials(body.params as unknown as FullMaterialsInput);
        break;

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: `סוג חישוב לא מוכר: ${body.type}`,
            validTypes: ['tiles', 'adhesive', 'grout', 'paint', 'plaster', 'spackel', 'flooring', 'all']
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type: body.type,
      result,
      meta: {
        calculatedAt: new Date().toISOString(),
        version: '1.0.0',
      },
    });

  } catch (error) {
    console.error('Materials calculation error:', error);
    
    const message = error instanceof Error ? error.message : 'שגיאה לא ידועה';
    
    return NextResponse.json(
      { 
        success: false, 
        error: message,
      },
      { status: 400 }
    );
  }
}

/**
 * GET /api/calculate-materials
 * מחזיר מידע על ה-API וערכי ברירת מחדל
 */
export async function GET() {
  return NextResponse.json({
    name: 'מחשבון חומרים - ShiputzAI',
    version: '1.0.0',
    description: 'API לחישוב כמויות חומרים לפרויקטי שיפוץ',
    endpoints: {
      POST: {
        description: 'חישוב חומרים',
        body: {
          type: 'סוג החישוב - tiles/adhesive/grout/paint/plaster/spackel/flooring/all',
          params: 'פרמטרים לחישוב',
        },
      },
    },
    calculationTypes: {
      tiles: {
        description: 'חישוב אריחים',
        requiredParams: ['roomArea', 'tileLength', 'tileWidth'],
        optionalParams: ['pattern', 'complexity', 'tilesPerBox', 'sqmPerBox', 'extraWastePercent'],
      },
      adhesive: {
        description: 'חישוב דבק לאריחים',
        requiredParams: ['area', 'tileLength', 'tileWidth'],
        optionalParams: ['adhesiveType', 'unevenSurface', 'bagWeightKg'],
      },
      grout: {
        description: 'חישוב רובה',
        requiredParams: ['area', 'tileLength', 'tileWidth'],
        optionalParams: ['jointWidth', 'jointDepth', 'bagWeightKg'],
      },
      paint: {
        description: 'חישוב צבע',
        requiredParams: ['roomLength', 'roomWidth', 'roomHeight'],
        optionalParams: ['paintType', 'coats', 'includeCeiling', 'openingsArea', 'canSizeLiters', 'includePrimer', 'surfaceType'],
      },
      plaster: {
        description: 'חישוב טיח',
        requiredParams: ['area'],
        optionalParams: ['thicknessMm', 'bagWeightKg'],
      },
      spackel: {
        description: 'חישוב שפכטל',
        requiredParams: ['area'],
        optionalParams: ['coats', 'containerWeightKg'],
      },
      flooring: {
        description: 'חישוב פרקט/למינציה',
        requiredParams: ['roomArea'],
        optionalParams: ['direction', 'complexity', 'sqmPerBox'],
      },
      all: {
        description: 'חישוב כל החומרים',
        requiredParams: ['roomLength', 'roomWidth'],
        optionalParams: ['roomHeight', 'calculateFloorTiles', 'calculateWallTiles', 'calculatePaint', 'calculateFlooring', 'tileParams', 'paintParams', 'flooringParams'],
      },
    },
    defaults: DEFAULT_VALUES,
    multipliers: MULTIPLIERS,
    examples: {
      tiles: {
        type: 'tiles',
        params: {
          roomArea: 20,
          tileLength: 60,
          tileWidth: 60,
          pattern: 'straight',
          complexity: 'simple',
        },
      },
      paint: {
        type: 'paint',
        params: {
          roomLength: 5,
          roomWidth: 4,
          roomHeight: 2.7,
          paintType: 'plastic',
          coats: 2,
          includeCeiling: true,
          openingsArea: 3,
        },
      },
      all: {
        type: 'all',
        params: {
          roomLength: 5,
          roomWidth: 4,
          roomHeight: 2.7,
          calculateFloorTiles: true,
          calculatePaint: true,
          tileParams: {
            tileLength: 60,
            tileWidth: 60,
            pattern: 'diagonal',
          },
        },
      },
    },
  });
}
