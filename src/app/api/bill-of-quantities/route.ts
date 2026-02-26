import { NextResponse } from "next/server";
import { AI_MODELS, GEMINI_BASE_URL } from "@/lib/ai-config";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      image, 
      fileName,
      scale,
      ceilingHeight = 2.70,
      buildingType,
      wallType,
      wallThickness,
      floorType,
      hasElectricalPlan,
      hasPlumbingPlan,
      additionalNotes,
      accuracyScore
    } = body;

    if (!image) {
      return NextResponse.json({ error: "לא התקבלה תמונה" }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Extract base64 data from data URL
    const base64Match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: "פורמט תמונה לא תקין" }, { status: 400 });
    }

    const mimeType = base64Match[1];
    const imageData = base64Match[2];

    // Build context from additional inputs
    const contextParts: string[] = [];
    
    if (scale) {
      contextParts.push(`- סקאלה ידועה: ${scale}`);
    }
    if (ceilingHeight && ceilingHeight !== 2.70) {
      contextParts.push(`- גובה תקרה: ${ceilingHeight} מ'`);
    }
    if (buildingType) {
      const buildingTypes: Record<string, string> = {
        apartment: 'דירה',
        house: 'בית פרטי',
        office: 'משרד',
        commercial: 'מסחרי'
      };
      contextParts.push(`- סוג מבנה: ${buildingTypes[buildingType] || buildingType}`);
    }
    if (wallType) {
      const wallTypes: Record<string, string> = {
        blocks: 'בלוקים',
        concrete: 'בטון',
        drywall: 'גבס',
        brick: 'לבנים'
      };
      contextParts.push(`- סוג קירות: ${wallTypes[wallType] || wallType}`);
    }
    if (wallThickness) {
      contextParts.push(`- עובי קירות: ${wallThickness} ס"מ`);
    }
    if (floorType) {
      const floorTypes: Record<string, string> = {
        tiles: 'אריחים',
        parquet: 'פרקט',
        concrete: 'בטון',
        marble: 'שיש'
      };
      contextParts.push(`- סוג ריצוף קיים: ${floorTypes[floorType] || floorType}`);
    }
    if (hasElectricalPlan) {
      contextParts.push(`- התכנית כוללת נקודות חשמל - זהה וספור אותן`);
    }
    if (hasPlumbingPlan) {
      contextParts.push(`- התכנית כוללת תכנית אינסטלציה - זהה נקודות מים וביוב`);
    }
    if (additionalNotes) {
      contextParts.push(`- הערות נוספות מהמשתמש: ${additionalNotes}`);
    }

    const additionalContext = contextParts.length > 0 
      ? `\n\n## מידע נוסף שסופק על ידי המשתמש:\n${contextParts.join('\n')}\n\nהשתמש במידע זה לשיפור דיוק הכמויות!`
      : '';

    const prompt = `אתה מומחה לכתבי כמויות ותכניות בניה בישראל, עם ניסיון של 20+ שנה.

נתח את התכנית המצורפת והפק כתב כמויות מפורט ומדויק בפורמט JSON.
${additionalContext}

## הוראות מפורטות:
1. זהה את סוג התכנית (דירה, בית פרטי, משרד וכו')
2. זהה כל החדרים/אזורים ושטחיהם המדויקים
3. מדוד אורכי קירות חיצוניים ופנימיים בנפרד
4. ספור דלתות (פנים, כניסה, מרפסת) וחלונות
5. חשב שטחי ריצוף (הוסף 15% פחת, לא 10%)
6. חשב שטחי צביעה נכון: (אורך קירות × גובה) - שטח פתחים
7. זהה חדרים רטובים והוסף חיפוי קירות ואיטום
8. הוסף עבודות גבס (ניקיונות, הכנה לצבע)
9. הערך מערכות מיזוג אוויר לפי גודל חדרים
${hasElectricalPlan ? '10. זהה וספור נקודות חשמל מהתכנית' : '10. הערך נקודות חשמל לפי סטנדרט (בית מודרני: 6-8 שקעים לחדר, 2-3 נקודות תאורה לחדר)'}
${hasPlumbingPlan ? '11. זהה נקודות אינסטלציה מהתכנית' : '11. הערך נקודות אינסטלציה לפי חדרים רטובים'}

## הנחות (השתמש רק אם לא צוין מידע ספציפי):
- גובה תקרה: ${ceilingHeight || 2.70} מ'
- עובי קיר חוץ: ${wallThickness || 20} ס"מ
- עובי קיר פנים: ${wallThickness ? Math.floor(parseInt(wallThickness) / 2) : 10} ס"מ
- גובה דלת: 210 ס"מ, רוחב דלת פנים: 80 ס"מ
- גובה חלון ממוצע: 120 ס"מ, רוחב: 120 ס"מ
- גובה אדן חלון: 90 ס"מ

## חישובי צביעה נכונים:
- צביעת קירות = (היקף חדר × גובה) - (שטח דלתות + שטח חלונות)
- צביעת תקרות = שטח רצפה
- אל תכפיל את שטח הצביעה פעמיים!

## קטגוריות נדרשות (כולל הערכות):
- שטחים (כל חדר בנפרד)
- קירות (חוץ ופנים)
- פתחים (דלתות וחלונות)
- ריצוף פנים (כולל 15% פחת)
- ריצוף חוץ (מרפסות, חניה - אם קיימים בתכנית)
- חיפוי קירות (חדרים רטובים + מטבח)
- איטום (חדרי רחצה, מרפסות, גגות)
- צביעה (קירות ותקרות בנפרד)
- גבס (הכנה, ניקיונות, תיקונים, תקרות אקוסטיות)
- חשמל (${hasElectricalPlan ? 'מבוסס תכנית' : 'הערכה גנרית'})
- אינסטלציה מים (${hasPlumbingPlan ? 'מבוסס תכנית' : 'הערכה גנרית'})
- אינסטלציה ביוב (${hasPlumbingPlan ? 'מבוסס תכנית' : 'הערכה גנרית'})
- גז (אם יש מטבח - נקודת גז + צנרת הערכה)
- מיזוג (הערכה לפי שטח - 1 יח' מפוצל ל-25 מ"ר)
- מערכת כיבוי אש (ספרינקלרים - אם נדרש לפי תקן: מעל 500 מ"ר או בניין מעל 4 קומות)
- פיתוח חוץ (אם יש גינה/חצר: ריצוף, תאורה, השקיה, גדר)
- אלומיניום (תריסים, מעקות מרפסת - אם קיימים)

## לבנייה חדשה בלבד (זהה אם זו בנייה ולא שיפוץ):
- עבודות עפר וחפירה
- יסודות ובטון
- קונסטרוקציה ושלד

## פורמט התשובה (JSON בלבד!):
{
  "summary": {
    "totalArea": { "label": "שטח כולל", "value": "XX", "unit": "מ\\"ר" },
    "rooms": { "label": "חדרים", "value": "X", "unit": "" },
    "walls": { "label": "קירות", "value": "XX", "unit": "מ\\"א" },
    "doors": { "label": "דלתות", "value": "X", "unit": "יח'" },
    "windows": { "label": "חלונות", "value": "X", "unit": "יח'" }
  },
  "items": [
    { "category": "שטחים", "description": "סלון + פינת אוכל", "quantity": "42", "unit": "מ\\"ר", "notes": "", "source": "תכנית" },
    { "category": "שטחים", "description": "מטבח", "quantity": "12", "unit": "מ\\"ר", "notes": "", "source": "תכנית" },
    { "category": "קירות", "description": "קירות חוץ", "quantity": "35", "unit": "מ\\"א", "notes": "היקף המבנה", "source": "תכנית" },
    { "category": "קירות", "description": "מחיצות פנים", "quantity": "45", "unit": "מ\\"א", "notes": "", "source": "תכנית" },
    { "category": "פתחים", "description": "דלת כניסה", "quantity": "1", "unit": "יח'", "notes": "100 ס\\"מ", "source": "תכנית" },
    { "category": "פתחים", "description": "דלתות פנים", "quantity": "8", "unit": "יח'", "notes": "80 ס\\"מ", "source": "תכנית" },
    { "category": "פתחים", "description": "חלונות", "quantity": "10", "unit": "יח'", "notes": "120x120 ס\\"מ", "source": "תכנית" },
    { "category": "ריצוף", "description": "ריצוף פנים", "quantity": "160", "unit": "מ\\"ר", "notes": "כולל 15% פחת", "source": "תכנית" },
    { "category": "חיפוי", "description": "חיפוי קירות חדרי רחצה", "quantity": "45", "unit": "מ\\"ר", "notes": "עד גובה 2 מ'", "source": "הערכה" },
    { "category": "איטום", "description": "איטום חדרי רחצה", "quantity": "12", "unit": "מ\\"ר", "notes": "רצפה + 20 ס\\"מ קיר", "source": "הערכה" },
    { "category": "איטום", "description": "איטום מרפסות", "quantity": "8", "unit": "מ\\"ר", "notes": "", "source": "הערכה" },
    { "category": "צביעה", "description": "צביעת קירות פנים", "quantity": "280", "unit": "מ\\"ר", "notes": "אקרילי, 2 שכבות", "source": "חישוב" },
    { "category": "צביעה", "description": "צביעת תקרות", "quantity": "140", "unit": "מ\\"ר", "notes": "", "source": "חישוב" },
    { "category": "גבס", "description": "תיקוני גבס והכנה", "quantity": "50", "unit": "מ\\"א", "notes": "ניקיונות, פינות", "source": "הערכה" },
    { "category": "חשמל", "description": "נקודות תאורה", "quantity": "25", "unit": "יח'", "notes": "", "source": "${hasElectricalPlan ? 'תכנית' : 'הערכה'}" },
    { "category": "חשמל", "description": "שקעים", "quantity": "55", "unit": "יח'", "notes": "כולל USB", "source": "${hasElectricalPlan ? 'תכנית' : 'הערכה'}" },
    { "category": "חשמל", "description": "מפסקים", "quantity": "20", "unit": "יח'", "notes": "", "source": "${hasElectricalPlan ? 'תכנית' : 'הערכה'}" },
    { "category": "אינסטלציה", "description": "נקודות מים קרים", "quantity": "12", "unit": "יח'", "notes": "", "source": "${hasPlumbingPlan ? 'תכנית' : 'הערכה'}" },
    { "category": "אינסטלציה", "description": "נקודות מים חמים", "quantity": "8", "unit": "יח'", "notes": "", "source": "${hasPlumbingPlan ? 'תכנית' : 'הערכה'}" },
    { "category": "אינסטלציה", "description": "נקודות ביוב", "quantity": "8", "unit": "יח'", "notes": "", "source": "${hasPlumbingPlan ? 'תכנית' : 'הערכה'}" },
    { "category": "מיזוג", "description": "יחידות מיזוג מפוצלות", "quantity": "4", "unit": "יח'", "notes": "הערכה לפי שטח", "source": "הערכה" },
    { "category": "גז", "description": "נקודת גז למטבח", "quantity": "1", "unit": "יח'", "notes": "כולל צנרת", "source": "הערכה" },
    { "category": "אלומיניום", "description": "תריסים חשמליים", "quantity": "10", "unit": "יח'", "notes": "לפי מספר חלונות", "source": "הערכה" },
    { "category": "אלומיניום", "description": "מעקה מרפסת", "quantity": "6", "unit": "מ\\"א", "notes": "אם יש מרפסת", "source": "תכנית" },
    { "category": "פיתוח חוץ", "description": "ריצוף חוץ", "quantity": "25", "unit": "מ\\"ר", "notes": "מרפסת/חניה", "source": "תכנית" },
    { "category": "פיתוח חוץ", "description": "תאורת חוץ", "quantity": "4", "unit": "יח'", "notes": "", "source": "הערכה" },
    { "category": "פיתוח חוץ", "description": "גדר היקפית", "quantity": "20", "unit": "מ\\"א", "notes": "אם יש חצר", "source": "הערכה" },
    { "category": "בטיחות", "description": "גלאי עשן", "quantity": "5", "unit": "יח'", "notes": "1 לכל חדר + מסדרון", "source": "הערכה" }
  ],
  "notes": [
    "הנתונים מבוססים על ניתוח התכנית בלבד",
    ${scale ? `"סקאלה: ${scale}",` : '"לא צוינה סקאלה - הכמויות הן הערכה",'}
    "פריטים מסומנים 'הערכה' מבוססים על סטנדרטים ולא על תכנית ספציפית",
    "מומלץ להוסיף 10-15% לכמויות כרזרבה",
    "לחוזה סופי יש להיעזר במודד כמויות מוסמך"
  ],
  "disclaimer": "כתב כמויות זה הינו הערכה ראשונית בלבד, המבוססת על ניתוח אוטומטי של התכנית. אין להסתמך עליו לצורך חתימת חוזה או התחייבות כספית. לקבלת כתב כמויות מדויק, יש לפנות למודד כמויות מוסמך עם תכניות מלאות (אדריכלות, קונסטרוקציה, חשמל, אינסטלציה)."
}

אם התמונה אינה תכנית בניה, החזר:
{
  "error": "התמונה אינה תכנית בניה מזוהה",
  "suggestion": "אנא העלה תכנית אדריכלית, תכנית קומות או שרטוט טכני"
}

החזר **רק JSON תקין**, ללא טקסט נוסף!`;

    const response = await fetch(`${GEMINI_BASE_URL}/${AI_MODELS.VISION_PRO}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: imageData
              }
            }
          ]
        }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.2
        }
      })
    });

    const geminiData = await response.json();

    if (geminiData.error) {
      console.error("Gemini API error:", JSON.stringify(geminiData.error, null, 2));
      return NextResponse.json({ error: "שגיאה בשירות AI", details: geminiData.error?.message || "Unknown error" }, { status: 500 });
    }

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      console.error("No candidates in response:", JSON.stringify(geminiData, null, 2));
      return NextResponse.json({ error: "לא התקבלה תשובה מה-AI" }, { status: 500 });
    }

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Try to extract JSON from the response
    let result;
    try {
      // Try to find JSON in the response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.log("Raw response:", rawText);
      
      // Return a generic error if we can't parse the response
      return NextResponse.json({
        error: "לא הצלחנו לנתח את התכנית",
        suggestion: "נסה להעלות תכנית ברורה יותר או בפורמט אחר"
      }, { status: 400 });
    }

    // Check if AI returned an error
    if (result.error) {
      return NextResponse.json(result, { status: 400 });
    }

    // Add accuracy score to result
    if (accuracyScore !== undefined) {
      result.accuracyScore = accuracyScore;
    }

    // Add metadata about inputs used
    result.metadata = {
      scale: scale || null,
      ceilingHeight: ceilingHeight || 2.70,
      buildingType: buildingType || null,
      wallType: wallType || null,
      wallThickness: wallThickness || null,
      floorType: floorType || null,
      hasElectricalPlan: hasElectricalPlan || false,
      hasPlumbingPlan: hasPlumbingPlan || false,
      generatedAt: new Date().toISOString()
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Bill of quantities error:", error);
    return NextResponse.json({ error: "שגיאה בעיבוד הבקשה" }, { status: 500 });
  }
}
