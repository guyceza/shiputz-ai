import { getSupabaseClient } from './supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vghfcdtzywbmlacltnjp.supabase.co';

export interface VisionHistoryItem {
  id: string;
  project_id: string;
  user_id: string;
  before_image_url: string;
  after_image_url: string;
  description: string;
  created_at: string;
}

// Upload image to Supabase Storage
async function uploadVisionImage(base64Data: string, userId: string, projectId: string, type: 'before' | 'after'): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    
    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    // Generate unique filename
    const filename = `vision/${userId}/${projectId}/${Date.now()}-${type}.jpg`;
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('visualizations')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Vision upload error:', error);
      return null;
    }
    
    // Return public URL
    return `${SUPABASE_URL}/storage/v1/object/public/visualizations/${filename}`;
  } catch (e) {
    console.error('Vision upload failed:', e);
    return null;
  }
}

// Save vision history item
export async function saveVisionHistory(
  projectId: string,
  userId: string,
  beforeImage: string,
  afterImage: string,
  description: string
): Promise<VisionHistoryItem | null> {
  try {
    const supabase = getSupabaseClient();
    
    // Upload images
    const beforeUrl = await uploadVisionImage(beforeImage, userId, projectId, 'before');
    const afterUrl = await uploadVisionImage(afterImage, userId, projectId, 'after');
    
    if (!beforeUrl || !afterUrl) {
      console.error('Failed to upload vision images');
      return null;
    }
    
    // Save to database
    const { data, error } = await supabase
      .from('vision_history')
      .insert({
        project_id: projectId,
        user_id: userId,
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        description
      })
      .select()
      .single();
    
    if (error) {
      console.error('Save vision history error:', error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Save vision history failed:', e);
    return null;
  }
}

// Load vision history for a project
export async function loadVisionHistory(projectId: string, userId: string): Promise<VisionHistoryItem[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('vision_history')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Load vision history error:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Load vision history failed:', e);
    return [];
  }
}

// Delete vision history item
export async function deleteVisionHistory(id: string, userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('vision_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Delete vision history error:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Delete vision history failed:', e);
    return false;
  }
}
