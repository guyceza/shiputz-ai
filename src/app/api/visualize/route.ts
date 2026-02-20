import { NextRequest, NextResponse } from "next/server";

// Cost estimation logic
interface CostItem {
  description: string;
  quantity: string;
  unitPrice: number;
  total: number;
}

interface CostEstimate {
  items: CostItem[];
  subtotal: number;
  laborPercent: number;
  labor: number;
  total: number;
  confidence: string;
}

// Parse description and calculate costs
function calculateCosts(analysisText: string, roomSize: number = 20): CostEstimate {
  const items: CostItem[] = [];
  const lowercaseText = analysisText.toLowerCase();
  
  // Cost rules (per unit, in ILS)
  const costRules: { keywords: string[]; name: string; perUnit: number; unit: string; estimateQty: (size: number) => number }[] = [
    { 
      keywords: ["פרקט", "parquet", "עץ", "wood floor", "רצפת עץ"],
      name: "פרקט / רצפת עץ",
      perUnit: 230,
      unit: "מ״ר",
      estimateQty: (size) => size * 1.1
    },
    { 
      keywords: ["ריצוף", "אריחים", "tiles", "קרמיקה", "ceramic", "פורצלן"],
      name: "ריצוף / אריחים",
      perUnit: 180,
      unit: "מ״ר",
      estimateQty: (size) => size * 1.1
    },
    { 
      keywords: ["צביעה", "צבע", "paint", "קיר", "wall color"],
      name: "צביעה",
      perUnit: 40,
      unit: "מ״ר",
      estimateQty: (size) => size * 3 // walls = floor * 3 approx
    },
    { 
      keywords: ["תאורה שקועה", "ספוטים", "spots", "spotlights", "תאורת ספוט"],
      name: "תאורה שקועה (ספוטים)",
      perUnit: 300,
      unit: "יחידה",
      estimateQty: (size) => Math.ceil(size / 3) // 1 spot per 3 sqm
    },
    { 
      keywords: ["תאורה עקיפה", "led", "לד", "סרט תאורה", "indirect"],
      name: "תאורה עקיפה LED",
      perUnit: 150,
      unit: "מטר",
      estimateQty: (size) => Math.ceil(Math.sqrt(size) * 2)
    },
    { 
      keywords: ["גבס", "גבס דקורטיבי", "תקרת גבס", "drywall", "gypsum"],
      name: "תקרת / קיר גבס",
      perUnit: 175,
      unit: "מ״ר",
      estimateQty: (size) => size
    },
    { 
      keywords: ["ארון", "ארונות", "closet", "cabinet", "ארון קיר"],
      name: "ארון קיר",
      perUnit: 2500,
      unit: "מטר",
      estimateQty: () => 2.5
    },
    { 
      keywords: ["מטבח", "kitchen", "ארונות מטבח"],
      name: "ארונות מטבח",
      perUnit: 3500,
      unit: "מטר",
      estimateQty: () => 4
    },
    { 
      keywords: ["משטח שיש", "שיש", "granite", "קוורץ", "quartz", "משטח עבודה"],
      name: "משטח שיש / קוורץ",
      perUnit: 1200,
      unit: "מטר",
      estimateQty: () => 3
    },
    { 
      keywords: ["חיפוי", "חיפוי קרמיקה", "backsplash", "קרמיקה לקיר"],
      name: "חיפוי קרמיקה",
      perUnit: 350,
      unit: "מ״ר",
      estimateQty: () => 3
    },
    { 
      keywords: ["אמבטיה", "מקלחת", "bathroom", "shower"],
      name: "שיפוץ חדר רחצה",
      perUnit: 15000,
      unit: "יחידה",
      estimateQty: () => 1
    },
    { 
      keywords: ["כיור", "sink", "ברז", "faucet"],
      name: "כיור + ברז",
      perUnit: 1500,
      unit: "יחידה",
      estimateQty: () => 1
    },
    { 
      keywords: ["חלון", "window", "חלונות"],
      name: "החלפת חלון",
      perUnit: 2500,
      unit: "יחידה",
      estimateQty: () => 1
    },
    { 
      keywords: ["דלת", "door", "דלתות"],
      name: "החלפת דלת",
      perUnit: 1800,
      unit: "יחידה",
      estimateQty: () => 1
    },
  ];

  // Match keywords and add to items
  for (const rule of costRules) {
    const matched = rule.keywords.some(kw => lowercaseText.includes(kw));
    if (matched) {
      const qty = rule.estimateQty(roomSize);
      items.push({
        description: rule.name,
        quantity: `${qty} ${rule.unit}`,
        unitPrice: rule.perUnit,
        total: Math.round(qty * rule.perUnit)
      });
    }
  }

  // If nothing matched, add a generic estimate
  if (items.length === 0) {
    items.push({
      description: "עבודות שיפוץ כלליות",
      quantity: `${roomSize} מ״ר`,
      unitPrice: 500,
      total: roomSize * 500
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const laborPercent = 25;
  const labor = Math.round(subtotal * (laborPercent / 100));
  const total = subtotal + labor;

  return {
    items,
    subtotal,
    laborPercent,
    labor,
    total,
    confidence: items.length > 3 ? "גבוה" : items.length > 1 ? "בינוני" : "נמוך"
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, description } = body;

    if (!image || !description) {
      return NextResponse.json(
        { error: "Missing required fields: image and description" },
        { status: 400 }
      );
    }

    // Read API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not found in environment");
      return NextResponse.json(
        { error: "API key not configured. Please add GEMINI_API_KEY to Vercel environment variables." },
        { status: 500 }
      );
    }
    console.log("API key found, length:", apiKey.length);

    // Step 1: Use Gemini to understand the request and enhance the prompt
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    // Extract base64 data if it's a data URL
    let imageBase64 = image;
    let mimeType = "image/jpeg";
    if (image.startsWith("data:")) {
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      }
    }

    const geminiPayload = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          },
          {
            text: `אתה מומחה עיצוב פנים ושיפוצים. נתחו את התמונה המצורפת והתארו:
1. מה רואים בתמונה (סוג החדר, מצב נוכחי)
2. מה השינויים שהמשתמש מבקש: "${description}"
3. כתבו תיאור מפורט בעברית של איך החדר ייראה אחרי השינויים
4. רשימת העבודות הנדרשות

פורמט התשובה:
===חדר נוכחי===
[תיאור]
===שינויים מבוקשים===
[פירוט]
===תוצאה צפויה===
[תיאור מפורט]
===עבודות נדרשות===
[רשימה]`
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
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return NextResponse.json(
        { error: `Gemini API error: ${geminiResponse.status}` },
        { status: 500 }
      );
    }

    const geminiData = await geminiResponse.json();
    const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Step 2: Calculate cost estimate from the analysis
    const costEstimate = calculateCosts(analysisText + " " + description);

    // Step 3: Edit image with Nano Banana Pro (gemini-3-pro-image-preview)
    const nanoBananaUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`;
    
    // Create edit prompt
    const editPrompt = `Edit this room image: ${description}. Make it look professionally renovated and modern. Keep the same room structure and perspective but apply the requested changes.`;

    const editPayload = {
      contents: [{
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: imageBase64
            }
          },
          {
            text: editPrompt
          }
        ]
      }],
      generationConfig: {
        responseModalities: ["image", "text"]
      }
    };

    let generatedImage: string | null = null;
    
    try {
      const editResponse = await fetch(nanoBananaUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPayload)
      });

      if (editResponse.ok) {
        const editData = await editResponse.json();
        // Look for image in response parts
        const parts = editData.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inline_data?.mime_type?.startsWith("image/")) {
            generatedImage = `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            break;
          }
        }
      } else {
        const errorText = await editResponse.text();
        console.error("Nano Banana edit error:", editResponse.status, errorText);
      }
    } catch (editError) {
      console.error("Image edit failed:", editError);
      // Continue without generated image - will use placeholder
    }

    // Step 4: Return the results
    return NextResponse.json({
      success: true,
      analysis: analysisText,
      generatedImage: generatedImage,
      costs: costEstimate,
      prompt: editPrompt,
      description: description
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Visualize API error:", errorMessage, error);
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
