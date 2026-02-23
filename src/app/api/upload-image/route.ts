import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

// Upload image to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const { image, folder, userId } = await request.json();
    
    if (!image || !userId) {
      return NextResponse.json({ error: 'Missing image or userId' }, { status: 400 });
    }
    
    // Extract base64 data and mime type
    let base64Data = image;
    let mimeType = 'image/jpeg';
    
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `${folder || 'misc'}/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    
    const supabase = createServiceClient();
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('project-images')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: false
      });
    
    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(filename);
    
    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      path: data.path
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
