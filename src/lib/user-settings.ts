import { getSupabaseClient } from './supabase';

export interface UserSettings {
  user_id: string;
  vision_usage_date: string | null;
  vision_usage_count: number;
  visualize_trial_used: boolean;
  newsletter_dismissed: boolean;
  updated_at: string;
}

// Get or create user settings
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const supabase = getSupabaseClient();
    
    // Try to get existing settings
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No row found - create one
      const { data: newData, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: userId })
        .select()
        .single();
      
      if (insertError) {
        console.error('Failed to create user settings:', insertError);
        return null;
      }
      return newData;
    }
    
    if (error) {
      console.error('Failed to get user settings:', error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error('getUserSettings error:', e);
    return null;
  }
}

// Update user settings
export async function updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: userId, 
        ...updates,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to update user settings:', error);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('updateUserSettings error:', e);
    return false;
  }
}

// Get vision usage for today
export async function getVisionUsage(userId: string): Promise<number> {
  const settings = await getUserSettings(userId);
  if (!settings) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  if (settings.vision_usage_date !== today) {
    return 0; // New day, reset count
  }
  
  return settings.vision_usage_count || 0;
}

// Increment vision usage
export async function incrementVisionUsage(userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];
  const settings = await getUserSettings(userId);
  
  let newCount = 1;
  if (settings && settings.vision_usage_date === today) {
    newCount = (settings.vision_usage_count || 0) + 1;
  }
  
  await updateUserSettings(userId, {
    vision_usage_date: today,
    vision_usage_count: newCount
  });
  
  return newCount;
}

// Check if trial was used
export async function isTrialUsed(userId: string): Promise<boolean> {
  const settings = await getUserSettings(userId);
  return settings?.visualize_trial_used || false;
}

// Mark trial as used
export async function markTrialUsed(userId: string): Promise<boolean> {
  return updateUserSettings(userId, { visualize_trial_used: true });
}

// Check if newsletter popup was dismissed
export async function isNewsletterDismissed(userId: string): Promise<boolean> {
  const settings = await getUserSettings(userId);
  return settings?.newsletter_dismissed || false;
}

// Dismiss newsletter popup
export async function dismissNewsletter(userId: string): Promise<boolean> {
  return updateUserSettings(userId, { newsletter_dismissed: true });
}
