import { NextRequest, NextResponse } from "next/server";

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "ShiputzAI <help@shipazti.com>";
const SUPPORT_EMAIL = "support@shipazti.com";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "נא למלא את כל השדות הנדרשים" },
        { status: 400 }
      );
    }

    if (!RESEND_KEY) {
      console.error("RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "שירות האימייל לא מוגדר" },
        { status: 500 }
      );
    }

    // Send email to support
    const supportEmailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: SUPPORT_EMAIL,
        subject: `פנייה חדשה מ-${name}`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1d1d1f;">פנייה חדשה מהאתר</h2>
            
            <table style="border-collapse: collapse; width: 100%; max-width: 500px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">שם:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">אימייל:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  <a href="mailto:${email}">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">טלפון:</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                  <a href="tel:${phone}">${phone}</a>
                </td>
              </tr>
              ` : ""}
            </table>
            
            <h3 style="color: #1d1d1f; margin-top: 20px;">הודעה:</h3>
            <div style="background: #f5f5f7; padding: 15px; border-radius: 8px; white-space: pre-wrap;">
              ${message}
            </div>
            
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
            <p style="color: #86868b; font-size: 12px;">
              פנייה זו נשלחה מטופס יצירת קשר באתר ShiputzAI
            </p>
          </div>
        `,
      }),
    });

    if (!supportEmailRes.ok) {
      const err = await supportEmailRes.text();
      console.error("Failed to send support email:", err);
      return NextResponse.json(
        { error: "שגיאה בשליחת הפנייה" },
        { status: 500 }
      );
    }

    // Send confirmation to user
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "קיבלנו את הפנייה שלך - ShiputzAI",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #1d1d1f;">היי ${name},</h2>
            
            <p>תודה שפנית אלינו!</p>
            
            <p>קיבלנו את הפנייה שלך ונחזור אליך בהקדם האפשרי.</p>
            
            <div style="background: #f5f5f7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <strong>ההודעה שלך:</strong><br>
              <span style="white-space: pre-wrap;">${message}</span>
            </div>
            
            <p>בברכה,<br>צוות ShiputzAI</p>
            
            <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
            <p style="color: #86868b; font-size: 12px;">
              <a href="https://shipazti.com" style="color: #0071e3;">ShiputzAI</a> - ניהול שיפוצים חכם
            </p>
          </div>
        `,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "שגיאה בשליחת הפנייה" },
      { status: 500 }
    );
  }
}
