import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
    
    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }
    
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
