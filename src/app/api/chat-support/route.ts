import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

const SYSTEM_PROMPT = `אתה נציג תמיכה ומכירות של ShiputzAI - מערכת לניהול שיפוצים עם בינה מלאכותית.

📋 מידע על המוצר:
- ShiputzAI עוזר לנהל שיפוץ בית/דירה בצורה חכמה
- מעקב תקציב בזמן אמת
- סריקת קבלות אוטומטית עם AI
- ניתוח הצעות מחיר - לדעת אם המחיר הוגן
- בדיקת חוזים - זיהוי סעיפים בעייתיים
- התראות חכמות על חריגות
- הדמיית חדרים - לראות איך השיפוץ יראה

💰 מחיר:
- ₪149.99 תשלום חד פעמי (במקום ₪299.99 - מבצע 50% הנחה)
- לכל משך הפרויקט, ללא הגבלת זמן
- ללא מנוי חודשי
- ללא כרטיס אשראי לתקופת נסיון

🎯 קהל יעד:
- משפצים פרטיים
- זוגות צעירים שקונים דירה
- כל מי שמתכנן שיפוץ

🏆 יתרונות:
- חוסך אלפי שקלים בהשוואת הצעות מחיר
- מונע חריגות תקציב
- תיעוד מסודר של כל ההוצאות
- AI שעונה על שאלות בנושא שיפוצים

📞 יצירת קשר:
- אתר: shipazti.com
- אימייל: support@shipazti.com

הנחיות:
1. ענה בעברית, בצורה ידידותית ומקצועית
2. התמקד בערך שהמוצר נותן
3. אם מישהו מתעניין, נסה לאסוף את המייל שלו
4. אם יש שאלה שאתה לא יודע - הפנה ל-support@shipazti.com
5. תשובות קצרות וממוקדות (2-3 משפטים מקסימום)
6. השתמש באימוג'ים במידה 👍`;

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "חסרה הודעה" },
        { status: 400 }
      );
    }

    // Build conversation history for context
    const chatHistory = history?.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    })) || [];

    // Create chat with history
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Check if this looks like a lead (contains email pattern or phone)
    const emailMatch = message.match(/[\w.-]+@[\w.-]+\.\w+/);
    const phoneMatch = message.match(/0\d{8,9}|05\d{8}/);
    
    if (emailMatch || phoneMatch) {
      // Save lead to Supabase
      try {
        await supabase.from("chat_leads").insert({
          email: emailMatch?.[0] || null,
          phone: phoneMatch?.[0] || null,
          conversation_id: conversationId,
          message: message,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error("Failed to save lead:", e);
      }
    }

    // Save conversation to Supabase (optional, for analytics)
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      });
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "assistant", 
        content: response,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      // Silently fail - chat still works without logging
      console.error("Failed to log chat:", e);
    }

    return NextResponse.json({ 
      response,
      conversationId 
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "שגיאה בעיבוד ההודעה. נסה שוב." },
      { status: 500 }
    );
  }
}
