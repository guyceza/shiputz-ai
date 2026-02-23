import { getSupabaseClient } from './supabase';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  budget: number;
  spent: number;
  created_at: string;
  updated_at?: string;
}

// Legacy interface for localStorage migration
interface LegacyProject {
  id: string;
  name: string;
  budget: number;
  spent: number;
  createdAt: string;
}

const MIGRATION_KEY = 'projects_migrated_to_supabase';

// Get all projects for current user
export async function getProjects(userId: string): Promise<Project[]> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching projects:', error);
    throw error;
  }
  
  return data || [];
}

// Create a new project
export async function createProject(userId: string, name: string, budget: number = 0): Promise<Project> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name,
      budget,
      spent: 0
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  
  return data;
}

// Update a project
export async function updateProject(projectId: string, updates: Partial<Pick<Project, 'name' | 'budget' | 'spent'>>): Promise<Project> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
  
  return data;
}

// Delete a project
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);
  
  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
}

// Add expense to project (updates spent amount)
export async function addExpense(projectId: string, amount: number): Promise<Project> {
  const supabase = getSupabaseClient();
  
  // Get current spent
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('spent')
    .eq('id', projectId)
    .single();
  
  if (fetchError) throw fetchError;
  
  const newSpent = (project?.spent || 0) + amount;
  
  return updateProject(projectId, { spent: newSpent });
}

// Migrate localStorage projects to Supabase (one-time)
export async function migrateLocalStorageProjects(userId: string): Promise<{ migrated: number; skipped: boolean }> {
  // Check if already migrated
  const migrationKey = `${MIGRATION_KEY}_${userId}`;
  if (typeof window !== 'undefined' && localStorage.getItem(migrationKey)) {
    return { migrated: 0, skipped: true };
  }
  
  // Get legacy projects from localStorage
  const legacyKey = `projects_${userId}`;
  const legacyData = typeof window !== 'undefined' ? localStorage.getItem(legacyKey) : null;
  
  if (!legacyData) {
    // No legacy data, mark as migrated
    if (typeof window !== 'undefined') {
      localStorage.setItem(migrationKey, 'true');
    }
    return { migrated: 0, skipped: false };
  }
  
  try {
    const legacyProjects: LegacyProject[] = JSON.parse(legacyData);
    
    if (!legacyProjects.length) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(migrationKey, 'true');
      }
      return { migrated: 0, skipped: false };
    }
    
    const supabase = getSupabaseClient();
    
    // Check for existing projects to avoid duplicates
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('name')
      .eq('user_id', userId);
    
    const existingNames = new Set(existingProjects?.map(p => p.name) || []);
    
    // Filter out duplicates
    const projectsToMigrate = legacyProjects.filter(p => !existingNames.has(p.name));
    
    if (projectsToMigrate.length > 0) {
      // Insert migrated projects
      const { error } = await supabase
        .from('projects')
        .insert(projectsToMigrate.map(p => ({
          user_id: userId,
          name: p.name,
          budget: p.budget || 0,
          spent: p.spent || 0,
          created_at: p.createdAt || new Date().toISOString()
        })));
      
      if (error) {
        console.error('Migration error:', error);
        throw error;
      }
    }
    
    // Mark as migrated
    if (typeof window !== 'undefined') {
      localStorage.setItem(migrationKey, 'true');
      // Optionally clear legacy data after successful migration
      // localStorage.removeItem(legacyKey);
    }
    
    return { migrated: projectsToMigrate.length, skipped: false };
    
  } catch (error) {
    console.error('Failed to migrate projects:', error);
    throw error;
  }
}

// Sync projects to localStorage (for offline support)
export function cacheProjectsLocally(userId: string, projects: Project[]): void {
  if (typeof window === 'undefined') return;
  
  // Convert to legacy format for backward compatibility
  const legacyFormat = projects.map(p => ({
    id: p.id,
    name: p.name,
    budget: p.budget,
    spent: p.spent,
    createdAt: p.created_at
  }));
  
  localStorage.setItem(`projects_${userId}`, JSON.stringify(legacyFormat));
}

// Get cached projects (fallback when offline)
export function getCachedProjects(userId: string): Project[] | null {
  if (typeof window === 'undefined') return null;
  
  const cached = localStorage.getItem(`projects_${userId}`);
  if (!cached) return null;
  
  try {
    const legacyProjects: LegacyProject[] = JSON.parse(cached);
    return legacyProjects.map(p => ({
      id: p.id,
      user_id: userId,
      name: p.name,
      budget: p.budget,
      spent: p.spent,
      created_at: p.createdAt
    }));
  } catch {
    return null;
  }
}
