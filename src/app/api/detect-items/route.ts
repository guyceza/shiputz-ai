export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = imageFile.type;

    // Use Gemini Vision to detect items
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `אתה מומחה לזיהוי רהיטים ופריטי עיצוב בתמונות.

נתח את התמונה וזהה את הפריטים הבאים:
- רהיטים (ספות, כורסאות, שולחנות, ארונות, מזנונים)
- תאורה (מנורות רצפה, מנורות שולחן, נברשות)
- צמחים ועציצים
- פריטי דקורציה בולטים
- סוג הריצוף/פרקט

עבור כל פריט החזר:
1. name - שם הפריט בעברית
2. position - מיקום משוער באחוזים מהתמונה:
   - top: אחוז מהחלק העליון
   - left: אחוז מהצד הימני
   - width: רוחב הפריט באחוזים
   - height: גובה הפריט באחוזים
3. searchQuery - שאילתת חיפוש בעברית לקנייה בישראל

החזר את התשובה בפורמט JSON בלבד, ללא טקסט נוסף:
{
  "items": [
    {
      "id": "item-1",
      "name": "שם הפריט",
      "position": {"top": 50, "left": 30, "width": 25, "height": 20},
      "searchQuery": "שאילתת חיפוש לקנייה"
    }
  ]
}`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      { text: prompt },
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse response");
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(parsedResponse);
  } catch (error) {
    console.error("Error detecting items:", error);
    return NextResponse.json(
      { error: "Failed to detect items" },
      { status: 500 }
    );
  }
}
