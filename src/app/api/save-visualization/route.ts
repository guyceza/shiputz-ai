export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vghfcdtzywbmlacltnjp.supabase.co';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, beforeImage, afterImage, description, analysis, costs } = body;

    if (!userId || !beforeImage || !afterImage || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Validate image sizes (rough check on base64 length)
    // Base64 is ~33% larger than binary, so 10MB binary ≈ 13.3MB base64
    const maxBase64Size = MAX_IMAGE_SIZE * 1.4;
    if (beforeImage.length > maxBase64Size || afterImage.length > maxBase64Size) {
      return NextResponse.json({ error: "Image too large. Maximum size is 10MB." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upload before image to storage
    const beforeBlob = await dataUrlToBlob(beforeImage);
    const beforeFilename = `${userId}/${Date.now()}-before.jpg`;
    
    const { error: beforeUploadError } = await supabase.storage
      .from('visualizations')
      .upload(beforeFilename, beforeBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (beforeUploadError) {
      console.error('Before image upload error:', beforeUploadError);
      return NextResponse.json({ error: "Failed to upload before image" }, { status: 500 });
    }

    const beforeUrl = `${SUPABASE_URL}/storage/v1/object/public/visualizations/${beforeFilename}`;

    // Upload after image to storage
    const afterBlob = await dataUrlToBlob(afterImage);
    const afterFilename = `${userId}/${Date.now()}-after.jpg`;
    
    const { error: afterUploadError } = await supabase.storage
      .from('visualizations')
      .upload(afterFilename, afterBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (afterUploadError) {
      console.error('After image upload error:', afterUploadError);
      return NextResponse.json({ error: "Failed to upload after image" }, { status: 500 });
    }

    const afterUrl = `${SUPABASE_URL}/storage/v1/object/public/visualizations/${afterFilename}`;

    // Save to database
    const { data, error: insertError } = await supabase
      .from('visualizations')
      .insert({
        user_id: userId,
        description,
        analysis: analysis || '',
        costs: costs || {},
        before_image_url: beforeUrl,
        after_image_url: afterUrl
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ error: "Failed to save visualization" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      visualization: {
        id: data.id,
        beforeImage: data.before_image_url,
        afterImage: data.after_image_url,
        description: data.description,
        analysis: data.analysis,
        costs: data.costs,
        createdAt: data.created_at
      }
    });

  } catch (error) {
    console.error('Save visualization error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Convert data URL to Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
