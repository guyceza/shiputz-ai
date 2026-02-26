import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Send weekly report emails - called by Vercel Cron
export async function GET(req: NextRequest) {
  try {
    // Verify Vercel cron secret to prevent unauthorized calls
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Also check for Vercel's cron header
      const vercelCron = req.headers.get("x-vercel-cron");
      if (!vercelCron) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabase = getSupabase();

    // Get all users who opted in for weekly reports
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, weekly_report_enabled")
      .eq("weekly_report_enabled", true);

    if (usersError || !users) {
      console.error("Failed to fetch users:", usersError);
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }

    const results = [];

    for (const user of users) {
      try {
        // Get user's projects
        const { data: projects } = await supabase
          .from("projects")
          .select("name, data")
          .eq("user_id", user.id);

        if (!projects || projects.length === 0) continue;

        // Calculate monthly stats
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

        let totalSpentThisMonth = 0;
        let expensesThisMonth = 0;
        const projectSummaries: Array<{
          name: string;
          spentThisMonth: number;
          totalSpent: number;
          budget: number;
          remaining: number;
        }> = [];

        for (const project of projects) {
          const data = project.data as any;
          if (!data) continue;

          const monthlyExpenses = (data.expenses || []).filter(
            (e: any) => new Date(e.date) >= oneMonthAgo
          );
          const monthlyTotal = monthlyExpenses.reduce(
            (sum: number, e: any) => sum + (e.amount || 0),
            0
          );

          totalSpentThisMonth += monthlyTotal;
          expensesThisMonth += monthlyExpenses.length;

          projectSummaries.push({
            name: project.name,
            spentThisMonth: monthlyTotal,
            totalSpent: data.spent || 0,
            budget: data.budget || 0,
            remaining: (data.budget || 0) - (data.spent || 0),
          });
        }

        // Send email
        if (RESEND_API_KEY) {
          const emailHtml = generateMonthlyReportHtml(
            user.name || user.email.split("@")[0],
            projectSummaries,
            totalSpentThisMonth,
            expensesThisMonth
          );

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "ShiputzAI <noreply@shipazti.com>",
              to: user.email,
              subject: `📊 סיכום חודשי - ShiputzAI`,
              html: emailHtml,
            }),
          });

          results.push({ email: user.email, status: "sent" });
        }
      } catch (err) {
        console.error(`Failed to send report to ${user.email}:`, err);
        results.push({ email: user.email, status: "failed" });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Weekly report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateMonthlyReportHtml(
  userName: string,
  projects: Array<{
    name: string;
    spentThisMonth: number;
    totalSpent: number;
    budget: number;
    remaining: number;
  }>,
  totalSpentThisMonth: number,
  expensesThisMonth: number
): string {
  const projectRows = projects
    .map(
      (p) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${p.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: ${p.spentThisMonth > 0 ? '#ef4444' : '#666'};">
          ${p.spentThisMonth > 0 ? `₪${p.spentThisMonth.toLocaleString()}` : '-'}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          ₪${p.totalSpent.toLocaleString()} / ₪${p.budget.toLocaleString()}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center; color: ${p.remaining < 0 ? '#ef4444' : '#22c55e'};">
          ₪${p.remaining.toLocaleString()}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">📊 סיכום חודשי</h1>
          <p style="color: #aaa; margin: 8px 0 0 0;">ShiputzAI</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333; margin: 0 0 24px 0;">
            שלום ${userName},
          </p>

          <!-- Summary Cards -->
          <div style="display: flex; gap: 16px; margin-bottom: 24px;">
            <div style="flex: 1; background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">הוצאות החודש</p>
              <p style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: bold;">
                ₪${totalSpentThisMonth.toLocaleString()}
              </p>
            </div>
            <div style="flex: 1; background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
              <p style="color: #666; margin: 0 0 8px 0; font-size: 14px;">פעולות</p>
              <p style="color: #1a1a1a; margin: 0; font-size: 24px; font-weight: bold;">
                ${expensesThisMonth}
              </p>
            </div>
          </div>

          <!-- Projects Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: right; font-weight: 600; color: #333;">פרויקט</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #333;">החודש</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #333;">סה״כ</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #333;">נותר</th>
              </tr>
            </thead>
            <tbody>
              ${projectRows}
            </tbody>
          </table>

          <!-- CTA -->
          <div style="text-align: center;">
            <a href="https://shipazti.com/dashboard" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 500;">
              צפה בלוח הבקרה
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            קיבלת מייל זה כי הפעלת דוחות חודשיים ב-ShiputzAI
          </p>
          <p style="color: #888; font-size: 12px; margin: 8px 0 0 0;">
            <a href="https://shipazti.com/unsubscribe" style="color: #666;">ביטול הרשמה</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
