export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vghfcdtzywbmlacltnjp.supabase.co';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Convert data URL to Blob
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl);
  return response.blob();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, image } = body;

    if (!userId || !image) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate image size
    const maxBase64Size = MAX_IMAGE_SIZE * 1.4;
    if (image.length > maxBase64Size) {
      return NextResponse.json({ error: "Image too large. Maximum size is 10MB." }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Upload image to storage
    const imageBlob = await dataUrlToBlob(image);
    const filename = `shop-look/${userId}/${Date.now()}.jpg`;
    
    const { error: uploadError } = await supabase.storage
      .from('visualizations')
      .upload(filename, imageBlob, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Image upload error:', uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/visualizations/${filename}`;

    // Get or create a default "Shop the Look" project for this user
    let projectId: string;
    
    const { data: existingProject } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'Shop the Look')
      .single();
    
    if (existingProject) {
      projectId = existingProject.id;
    } else {
      // Create default project for Shop the Look
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: userId,
          name: 'Shop the Look',
          budget: 0,
          spent: 0
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('Project creation error:', projectError);
        return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
      }
      projectId = newProject.id;
    }

    // Create vision_history entry for Shop the Look
    const { data, error: insertError } = await supabase
      .from('vision_history')
      .insert({
        project_id: projectId,
        user_id: userId,
        before_image_url: imageUrl,
        after_image_url: imageUrl, // Same image - no transformation
        description: 'Shop the Look - זיהוי מוצרים'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ error: "Failed to save image" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      visionId: data.id,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error('Save shop look image error:', error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
