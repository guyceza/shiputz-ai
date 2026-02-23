import { getSupabaseClient } from './supabase';

export interface VisionHistoryItem {
  id: string;
  project_id: string;
  user_id: string;
  before_image_url: string;
  after_image_url: string;
  description: string;
  created_at: string;
}

// Save vision history item via API (uses service role on server)
export async function saveVisionHistory(
  projectId: string,
  userId: string,
  beforeImage: string,
  afterImage: string,
  description: string
): Promise<VisionHistoryItem | null> {
  try {
    console.log('saveVisionHistory: Saving via API for project:', projectId);
    
    const response = await fetch('/api/save-vision-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        userId,
        beforeImage,
        afterImage,
        description
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Save vision history API error:', errorData);
      return null;
    }

    const result = await response.json();
    
    if (!result.success || !result.item) {
      console.error('Save vision history failed:', result);
      return null;
    }

    console.log('saveVisionHistory: Save successful!', result.item.id);
    return result.item;
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
