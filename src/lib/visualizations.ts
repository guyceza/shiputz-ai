export interface Visualization {
  id: string;
  user_id: string;
  description: string;
  analysis: string;
  costs: any;
  before_image_url: string;
  after_image_url: string;
  created_at: string;
  detected_products?: any[];
}

// Save visualization via API (uses service role on server)
export async function saveVisualization(
  userId: string,
  beforeImage: string,
  afterImage: string,
  description: string,
  analysis: string,
  costs: any
): Promise<Visualization | null> {
  try {
    const response = await fetch('/api/save-visualization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        beforeImage,
        afterImage,
        description,
        analysis,
        costs
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Save API error:', errorData);
      return null;
    }

    const result = await response.json();
    
    if (!result.success || !result.visualization) {
      console.error('Save failed:', result);
      return null;
    }

    // Map API response to Visualization type
    return {
      id: result.visualization.id,
      user_id: userId,
      description: result.visualization.description,
      analysis: result.visualization.analysis,
      costs: result.visualization.costs,
      before_image_url: result.visualization.beforeImage,
      after_image_url: result.visualization.afterImage,
      created_at: result.visualization.createdAt
    };
  } catch (e) {
    console.error('Save failed:', e);
    return null;
  }
}

// Load user's visualizations via API
export async function loadVisualizations(userId: string): Promise<Visualization[]> {
  try {
    // Get Supabase session token from localStorage
    const supabaseKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    let accessToken = '';
    if (supabaseKey) {
      try {
        const session = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
        accessToken = session.access_token || '';
      } catch (e) {
        console.error('Failed to parse Supabase session:', e);
      }
    }
    
    const response = await fetch(`/api/get-visualizations?userId=${encodeURIComponent(userId)}`, {
      credentials: 'include',
      headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
    });
    
    if (!response.ok) {
      console.error('Load API error:', response.status);
      return [];
    }

    const result = await response.json();
    return result.visualizations || [];
  } catch (e) {
    console.error('Load failed:', e);
    return [];
  }
}

// Delete visualization via API
export async function deleteVisualization(id: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/delete-visualization', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, userId })
    });

    if (!response.ok) {
      console.error('Delete API error:', response.status);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (e) {
    console.error('Delete failed:', e);
    return false;
  }
}
