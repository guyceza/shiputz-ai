export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ONE-TIME MIGRATION ENDPOINT - DELETE AFTER USE
// Run: curl -X POST https://shipazti.com/api/run-migration?secret=shiputz2026

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  
  // Simple protection
  if (secret !== 'shiputz2026') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // Check if column exists by trying to select it
    const { error: checkError } = await supabase
      .from('vision_history')
      .select('detected_products')
      .limit(1);

    if (checkError && checkError.code === '42703') {
      // Column doesn't exist - but we can't run ALTER TABLE via REST API
      // We need to use raw SQL which requires database connection
      return NextResponse.json({ 
        success: false,
        message: "Column doesn't exist. Need to run SQL directly in Supabase Dashboard.",
        sql: "ALTER TABLE vision_history ADD COLUMN IF NOT EXISTS detected_products JSONB DEFAULT NULL;"
      });
    }

    if (checkError) {
      return NextResponse.json({ 
        success: false, 
        error: checkError.message,
        code: checkError.code 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Column already exists!" 
    });

  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "Use POST with ?secret=shiputz2026 to run migration" 
  });
}
