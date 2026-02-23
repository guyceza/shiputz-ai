import { getSupabaseClient } from './supabase';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  budget: number;
  spent: number;
  created_at: string;
  updated_at?: string;
  data?: ProjectData;
}

// All the nested data that syncs with Supabase
export interface ProjectData {
  expenses?: Expense[];
  categoryBudgets?: CategoryBudget[];
  phases?: Phase[];
  tasks?: Task[];
  photos?: ProgressPhoto[];
  suppliers?: Supplier[];
  savedQuotes?: SavedQuote[];
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  invoiceDate?: string;
  imageUrl?: string;
  vendor?: string;
  items?: ExpenseItem[];
  fullText?: string;
  vatIncluded?: boolean;
  vatAmount?: number;
}

export interface ExpenseItem {
  name: string;
  quantity?: number;
  price?: number;
}

export interface CategoryBudget {
  category: string;
  allocated: number;
}

export interface Phase {
  id: string;
  name: string;
  status: "pending" | "in-progress" | "completed";
  order: number;
}

export interface Task {
  id: string;
  phaseId: string;
  text: string;
  completed: boolean;
}

export interface ProgressPhoto {
  id: string;
  imageUrl: string;
  date: string;
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  profession: string;
  rating: number;
  notes?: string;
}

export interface SavedQuote {
  id: string;
  supplierName: string;
  description: string;
  amount: number;
  date: string;
  imageUrl?: string;
}

// Legacy interface for localStorage migration
interface LegacyProject {
  id: string;
  name: string;
  budget: number;
  spent: number;
  createdAt: string;
  expenses?: Expense[];
  categoryBudgets?: CategoryBudget[];
  phases?: Phase[];
  tasks?: Task[];
  photos?: ProgressPhoto[];
  suppliers?: Supplier[];
  savedQuotes?: SavedQuote[];
}

const MIGRATION_KEY = 'projects_migrated_to_supabase_v2';

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

// Get single project by ID
export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching project:', error);
    throw error;
  }
  
  return data;
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
      spent: 0,
      data: {}
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  
  return data;
}

// Update a project (including nested data)
export async function updateProject(projectId: string, updates: Partial<Pick<Project, 'name' | 'budget' | 'spent' | 'data'>>): Promise<Project> {
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

// Save full project data (expenses, suppliers, etc.)
export async function saveProjectData(projectId: string, data: ProjectData, spent?: number): Promise<Project> {
  const updates: Partial<Project> = { data };
  if (spent !== undefined) {
    updates.spent = spent;
  }
  return updateProject(projectId, updates);
}

// Migrate localStorage projects to Supabase (one-time, v2 with full data)
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
      .select('name, id')
      .eq('user_id', userId);
    
    const existingNames = new Set(existingProjects?.map(p => p.name) || []);
    
    // Filter out duplicates and prepare for migration
    const projectsToMigrate = legacyProjects.filter(p => !existingNames.has(p.name));
    
    if (projectsToMigrate.length > 0) {
      // Insert migrated projects with full data
      const { error } = await supabase
        .from('projects')
        .insert(projectsToMigrate.map(p => ({
          user_id: userId,
          name: p.name,
          budget: p.budget || 0,
          spent: p.spent || 0,
          created_at: p.createdAt || new Date().toISOString(),
          data: {
            expenses: p.expenses || [],
            categoryBudgets: p.categoryBudgets || [],
            phases: p.phases || [],
            tasks: p.tasks || [],
            photos: p.photos || [],
            suppliers: p.suppliers || [],
            savedQuotes: p.savedQuotes || []
          }
        })));
      
      if (error) {
        console.error('Migration error:', error);
        throw error;
      }
    }
    
    // Also update existing projects with their localStorage data
    for (const legacyProject of legacyProjects) {
      const existing = existingProjects?.find(p => p.name === legacyProject.name);
      if (existing && (legacyProject.expenses?.length || legacyProject.suppliers?.length)) {
        // Update existing project with localStorage data
        await supabase
          .from('projects')
          .update({
            spent: legacyProject.spent || 0,
            data: {
              expenses: legacyProject.expenses || [],
              categoryBudgets: legacyProject.categoryBudgets || [],
              phases: legacyProject.phases || [],
              tasks: legacyProject.tasks || [],
              photos: legacyProject.photos || [],
              suppliers: legacyProject.suppliers || [],
              savedQuotes: legacyProject.savedQuotes || []
            }
          })
          .eq('id', existing.id);
      }
    }
    
    // Mark as migrated
    if (typeof window !== 'undefined') {
      localStorage.setItem(migrationKey, 'true');
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
    createdAt: p.created_at,
    expenses: p.data?.expenses || [],
    categoryBudgets: p.data?.categoryBudgets || [],
    phases: p.data?.phases || [],
    tasks: p.data?.tasks || [],
    photos: p.data?.photos || [],
    suppliers: p.data?.suppliers || [],
    savedQuotes: p.data?.savedQuotes || []
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
      created_at: p.createdAt,
      data: {
        expenses: p.expenses || [],
        categoryBudgets: p.categoryBudgets || [],
        phases: p.phases || [],
        tasks: p.tasks || [],
        photos: p.photos || [],
        suppliers: p.suppliers || [],
        savedQuotes: p.savedQuotes || []
      }
    }));
  } catch {
    return null;
  }
}

// Get single cached project
export function getCachedProject(userId: string, projectId: string): Project | null {
  const projects = getCachedProjects(userId);
  return projects?.find(p => p.id === projectId) || null;
}
