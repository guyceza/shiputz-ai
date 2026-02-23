import { getSupabaseClient } from './supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vghfcdtzywbmlacltnjp.supabase.co';

export interface Visualization {
  id: string;
  user_id: string;
  description: string;
  analysis: string;
  costs: any;
  before_image_url: string;
  after_image_url: string;
  created_at: string;
}

// Upload image to Supabase Storage
export async function uploadImage(base64Data: string, userId: string, type: 'before' | 'after'): Promise<string | null> {
  try {
    const supabase = getSupabaseClient();
    
    // Convert base64 to blob
    const base64Response = await fetch(base64Data);
    const blob = await base64Response.blob();
    
    // Generate unique filename
    const filename = `${userId}/${Date.now()}-${type}.jpg`;
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('visualizations')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    // Return public URL
    return `${SUPABASE_URL}/storage/v1/object/public/visualizations/${filename}`;
  } catch (e) {
    console.error('Upload failed:', e);
    return null;
  }
}

// Save visualization to database
export async function saveVisualization(
  userId: string,
  beforeImage: string,
  afterImage: string,
  description: string,
  analysis: string,
  costs: any
): Promise<Visualization | null> {
  try {
    const supabase = getSupabaseClient();
    
    // Upload images to storage
    const beforeUrl = await uploadImage(beforeImage, userId, 'before');
    const afterUrl = await uploadImage(afterImage, userId, 'after');
    
    if (!beforeUrl || !afterUrl) {
      console.error('Failed to upload images');
      return null;
    }
    
    // Save to database
    const { data, error } = await supabase
      .from('visualizations')
      .insert({
        user_id: userId,
        description,
        analysis,
        costs,
        before_image_url: beforeUrl,
        after_image_url: afterUrl
      })
      .select()
      .single();
    
    if (error) {
      console.error('Save error:', error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('Save failed:', e);
    return null;
  }
}

// Load user's visualizations
export async function loadVisualizations(userId: string): Promise<Visualization[]> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('visualizations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Load error:', error);
      return [];
    }
    
    return data || [];
  } catch (e) {
    console.error('Load failed:', e);
    return [];
  }
}

// Delete visualization
export async function deleteVisualization(id: string, userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    // Get the visualization first to delete images
    const { data: viz } = await supabase
      .from('visualizations')
      .select('before_image_url, after_image_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    // Delete from database
    const { error } = await supabase
      .from('visualizations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    // Try to delete images from storage (best effort)
    if (viz) {
      const extractPath = (url: string) => url.split('/visualizations/')[1];
      if (viz.before_image_url) {
        await supabase.storage.from('visualizations').remove([extractPath(viz.before_image_url)]);
      }
      if (viz.after_image_url) {
        await supabase.storage.from('visualizations').remove([extractPath(viz.after_image_url)]);
      }
    }
    
    return true;
  } catch (e) {
    console.error('Delete failed:', e);
    return false;
  }
}
