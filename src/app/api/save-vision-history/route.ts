export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getAuthUser } from "@/lib/server-auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vghfcdtzywbmlacltnjp.supabase.co';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, beforeImage, afterImage, description } = body;

    if (!projectId || !userId || !beforeImage || !afterImage) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Bug #H03 fix: Verify authenticated user matches userId
    const authUser = await getAuthUser();
    if (!authUser || authUser.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Validate image sizes (rough check on base64 length)
    const maxBase64Size = MAX_IMAGE_SIZE * 1.4;
    if (beforeImage.length > maxBase64Size || afterImage.length > maxBase64Size) {
      return NextResponse.json({ error: "Image too large. Maximum size is 10MB." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upload before image to storage
    const beforeBlob = await dataUrlToBlob(beforeImage);
    const beforeFilename = `vision/${userId}/${projectId}/${Date.now()}-before.jpg`;
    
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
    const afterFilename = `vision/${userId}/${projectId}/${Date.now()}-after.jpg`;
    
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
      .from('vision_history')
      .insert({
        project_id: projectId,
        user_id: userId,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        description: description || ''
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ error: "Failed to save vision history" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: {
        id: data.id,
        project_id: data.project_id,
        user_id: data.user_id,
        before_image_url: data.before_image_url,
        after_image_url: data.after_image_url,
        description: data.description,
        created_at: data.created_at
      }
    });

  } catch (error) {
    console.error('Save vision history error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Convert data URL to Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}
