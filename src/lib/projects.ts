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
  // Onboarding wizard data
  projectType?: string;    // full-renovation, room-renovation, design-furniture, new-build
  propertyType?: string;   // apartment, house, penthouse, office, commercial
  budgetRange?: string;    // under-50k, 50k-100k, 100k-200k, 200k-500k, over-500k
  timeline?: string;       // 1month, 3months, 6months, 1year, unsure
  wizardStep?: number;     // current step in project wizard (1-6)
  rooms?: RoomData[];      // detected rooms from floorplan
  floorplanUrl?: string;   // uploaded floorplan image URL

  // Existing data
  expenses?: Expense[];
  categoryBudgets?: CategoryBudget[];
  phases?: Phase[];
  tasks?: Task[];
  photos?: ProgressPhoto[];
  suppliers?: Supplier[];
  savedQuotes?: SavedQuote[];
}

export interface RoomData {
  id: string;
  name: string;
  nameHe: string;
  purpose: string;
  dimensions?: { width: number; height: number };
  furniture?: string[];
  visualizations?: string[];  // URLs to visualization images
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

// Get all projects for current user (via API to bypass RLS)
export async function getProjects(userId: string): Promise<Project[]> {
  const response = await fetch(`/api/projects?userId=${encodeURIComponent(userId)}`);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching projects:', error);
    throw new Error(error.error || 'Failed to fetch projects');
  }
  
  return response.json();
}

// Get single project by ID (via API to bypass RLS)
export async function getProject(projectId: string): Promise<Project | null> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
  
  if (response.status === 404) {
    return null;
  }
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching project:', error);
    throw new Error(error.error || 'Failed to fetch project');
  }
  
  return response.json();
}

// Create a new project (via API to bypass RLS)
export async function createProject(userId: string, name: string, budget: number = 0, onboardingData?: {
  projectType?: string;
  propertyType?: string;
  budgetRange?: string;
  timeline?: string;
}): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name, budget, onboardingData }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error creating project:', error);
    throw new Error(error.error || 'Failed to create project');
  }
  
  return response.json();
}

// Update a project (including nested data) - via API to bypass RLS
export async function updateProject(projectId: string, updates: Partial<Pick<Project, 'name' | 'budget' | 'spent' | 'data'>>, userId: string): Promise<Project> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, ...updates }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error updating project:', error);
    throw new Error(error.error || 'Failed to update project');
  }
  
  return response.json();
}

// Delete a project - via API to bypass RLS
export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error deleting project:', error);
    throw new Error(error.error || 'Failed to delete project');
  }
}

// Save full project data (expenses, suppliers, etc.)
export async function saveProjectData(projectId: string, data: ProjectData, userId: string, spent?: number): Promise<Project> {
  const updates: Partial<Project> = { data };
  if (spent !== undefined) {
    updates.spent = spent;
  }
  return updateProject(projectId, updates, userId);
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
