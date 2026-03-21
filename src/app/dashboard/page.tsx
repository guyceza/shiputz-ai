"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanel from "./admin-panel";
import ReferralWidget from "@/components/ReferralWidget";
import { isAdminEmail } from "@/lib/admin";
import { DashboardSkeleton } from "@/components/Skeleton";
import NewProjectWizard from "@/components/NewProjectWizard";
import RoleSelector from "@/components/RoleSelector";
import type { Role } from "@/components/RoleSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SettingsModal } from "@/components/SettingsModal";
import LoadingScreen from "@/components/LoadingScreen";
import { 
  getProjects, 
  createProject, 
  updateProject,
  deleteProject,
  migrateLocalStorageProjects, 
  cacheProjectsLocally,
  getCachedProjects,
  type Project 
} from "@/lib/projects";

// Display interface (maps from Supabase format)
interface DisplayProject {
  id: string;
  name: string;
  budget: number;
  spent: number;
  createdAt: string;
}

const TIPS = [
  "בקש מהקבלן אחריות בכתב על העבודה",
  "תמיד השאר 10-15% מהתקציב לבלת״מים",
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const [user, setUser] = useState<{ name?: string; email: string; id?: string; role?: string } | null>(null);
  const [projects, setProjects] = useState<DisplayProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'role' | 'all'>('role');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [hasVisionSub, setHasVisionSub] = useState(false);
  const [hasLocalVision, setHasLocalVision] = useState(false); // Vision from localStorage (legacy)
  const [visionSubInfo, setVisionSubInfo] = useState<{
    cancelAtPeriodEnd: boolean;
    periodEnd: string | null;
  } | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  
  // Edit/Delete project state
  const [editingProject, setEditingProject] = useState<DisplayProject | null>(null);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<DisplayProject | null>(null);
  const [projectMenuOpen, setProjectMenuOpen] = useState<string | null>(null);

  // Random tip that changes on refresh
  const randomTip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setProjectMenuOpen(null);
    if (projectMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [projectMenuOpen]);

  // Google Ads conversion tracking — fire once per session on dashboard load
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      const key = 'gads_signup_fired';
      if (!sessionStorage.getItem(key)) {
        (window as any).gtag('event', 'conversion', {
          send_to: 'AW-17986657494/d13QCJrKn4IcENa52oBD',
        });
        sessionStorage.setItem(key, '1');
      }
    }
  }, []);

  useEffect(() => {
    // Check for auth session
    const checkAuth = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        let userId: string | null = null;
        
        if (session?.user) {
          // Real authenticated user
          userId = session.user.id;
          const userRole = session.user.user_metadata?.role;
          setUser({ 
            id: session.user.id,
            email: session.user.email || "", 
            name: session.user.user_metadata?.name,
            role: userRole,
          });
          // Show role selector for existing users without a role
          if (!userRole) {
            setShowRoleModal(true);
          }
          // Check if admin
          if (isAdminEmail(session.user.email || "")) {
            setIsAdmin(true);
          }
          
          // Check premium and vision subscription in PARALLEL (faster!)
          if (session.user.email) {
            const email = encodeURIComponent(session.user.email);
            
            // Start both requests at once
            const [premiumRes, visionRes] = await Promise.all([
              fetch(`/api/users?email=${email}`).catch(() => null),
              fetch(`/api/check-vision?email=${email}`).catch(() => null)
            ]);
            
            // Handle premium result
            if (premiumRes?.ok) {
              try {
                const userData = await premiumRes.json();
                const purchased = userData.purchased === true;
                setIsPremium(purchased);
                
                // Update localStorage with fresh data - ONLY if we have valid user data
                const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                if (storedUser.id) {
                  localStorage.setItem("user", JSON.stringify({
                    ...storedUser,
                    purchased: purchased
                  }));
                }
              } catch (e) {
                console.error("Premium parse error:", e);
              }
            }
            
            // Handle vision result
            if (visionRes?.ok) {
              try {
                const visionData = await visionRes.json();
                setHasVisionSub(visionData.hasSubscription);
                if (visionData.hasSubscription) {
                  setVisionSubInfo({
                    cancelAtPeriodEnd: visionData.cancelAtPeriodEnd,
                    periodEnd: visionData.periodEnd
                  });
                }
              } catch (e) {
                console.error("Vision parse error:", e);
              }
            }
          }
        } else {
          // Fallback to localStorage for backward compatibility
          const userData = localStorage.getItem("user");
          if (!userData) {
            router.push("/login");
            return;
          }
          // Bug #25 fix: Wrap JSON.parse in try-catch
          try {
            const parsedUser = JSON.parse(userData);
            userId = parsedUser.id;
            setUser(parsedUser);
          } catch (e) {
            console.error("Invalid user data in localStorage:", e);
            localStorage.removeItem("user");
            router.push("/login");
            return;
          }
        }

        // Load projects from Supabase (with localStorage migration & fallback)
        if (userId) {
          setProjectsLoading(true);
          try {
            // First, migrate any localStorage projects to Supabase (one-time)
            await migrateLocalStorageProjects(userId);
            
            // Load projects from Supabase
            const supabaseProjects = await getProjects(userId);
            const displayProjects: DisplayProject[] = supabaseProjects.map(p => ({
              id: p.id,
              name: p.name,
              budget: p.budget,
              spent: p.spent,
              createdAt: p.created_at
            }));
            setProjects(displayProjects);
            
            // Handle action parameter (deep links from emails)
            if (actionParam && supabaseProjects.length > 0) {
              const firstProject = supabaseProjects[0];
              router.push(`/project/${firstProject.id}?action=${actionParam}`);
              return;
            }
            
            // Cache locally for offline support
            cacheProjectsLocally(userId, supabaseProjects);
          } catch (err) {
            console.error("Failed to load projects from Supabase:", err);
            // Fallback to cached localStorage
            const cached = getCachedProjects(userId);
            if (cached) {
              setProjects(cached.map(p => ({
                id: p.id,
                name: p.name,
                budget: p.budget,
                spent: p.spent,
                createdAt: p.created_at
              })));
            }
          }
          setProjectsLoading(false);
          
        }
      } catch (e) {
        console.error("Auth check error:", e);
        // Fallback to localStorage
        const userData = localStorage.getItem("user");
        if (!userData) {
          router.push("/login");
          return;
        }
        // Bug #25 fix: Wrap JSON.parse in try-catch
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
          // Load projects from localStorage (offline fallback)
          if (parsedUser.id) {
            const cached = getCachedProjects(parsedUser.id);
            if (cached) {
              setProjects(cached.map(p => ({
                id: p.id,
                name: p.name,
                budget: p.budget,
                spent: p.spent,
                createdAt: p.created_at
              })));
            }
          }
        } catch (parseError) {
          console.error("Invalid user data in localStorage:", parseError);
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleCancelSubscription = async () => {
    if (!user?.email && !user?.id) return;
    
    setIsCanceling(true);
    
    // Cancel vision subscription via Supabase
    try {
      const res = await fetch('/api/cancel-vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCancelSuccess(true);
        setHasVisionSub(false);
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowCancelModal(false);
          setCancelSuccess(false);
        }, 2000);
      } else {
        const error = await res.json();
        alert(error.error || 'שגיאה בביטול המנוי');
      }
    } catch (e) {
      console.error('Cancel error:', e);
      alert('שגיאה בביטול המנוי');
    }
    setIsCanceling(false);
  };

  const budgetRangeToNumber = (range: string): number => {
    const map: Record<string, number> = {
      "under-50k": 50000,
      "50k-100k": 100000,
      "100k-200k": 200000,
      "200k-500k": 500000,
      "over-500k": 750000,
    };
    return map[range] || 100000;
  };

  const handleWizardComplete = async (wizardData: { name: string; projectType: string; propertyType: string; budgetRange: string; timeline: string }) => {
    const budgetNum = budgetRangeToNumber(wizardData.budgetRange);
    const projectName = wizardData.name;
    const onboardingData = {
      projectType: wizardData.projectType,
      propertyType: wizardData.propertyType,
      budgetRange: wizardData.budgetRange,
      timeline: wizardData.timeline,
    };

    // Reuse existing creation logic
    await handleCreateProjectInternal(projectName, budgetNum, onboardingData);
  };

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectBudget) return;
    
    const budgetNum = parseInt(newProjectBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert("נא להזין תקציב תקין");
      return;
    }
    await handleCreateProjectInternal(newProjectName, budgetNum);
  };

  const handleCreateProjectInternal = async (projectName: string, budgetNum: number, onboardingData?: { projectType: string; propertyType: string; budgetRange: string; timeline: string }) => {

    try {
      // Get user ID
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      // Bug #25 fix: Safe JSON parse with fallback
      let userId: string | undefined = session?.user?.id;
      if (!userId) {
        try {
          userId = JSON.parse(localStorage.getItem("user") || "{}").id;
        } catch {
          userId = undefined;
        }
      }
      
      if (!userId) {
        alert("נא להתחבר מחדש");
        return;
      }

      // Create project in Supabase
      const newProject = await createProject(userId, projectName, budgetNum, onboardingData);
      
      // Update local state
      const displayProject: DisplayProject = {
        id: newProject.id,
        name: newProject.name,
        budget: newProject.budget,
        spent: newProject.spent,
        createdAt: newProject.created_at
      };
      
      const updatedProjects = [...projects, displayProject];
      setProjects(updatedProjects);
      
      // Update localStorage cache
      cacheProjectsLocally(userId, updatedProjects.map(p => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        budget: p.budget,
        spent: p.spent,
        created_at: p.createdAt
      })));
      
    } catch (err) {
      console.error("Failed to create project:", err);
      alert("שגיאה ביצירת הפרויקט. נסה שוב.");
      return;
    }
    
    setShowNewProject(false);
    setNewProjectName("");
    setNewProjectBudget("");
  };

  const handleLogout = async () => {
    try {
      const { signOut } = await import("@/lib/auth");
      await signOut();
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem("user");
    router.push("/");
  };

  // Edit project
  const handleEditProject = async () => {
    if (!editingProject || !editName || !editBudget) return;
    
    const budgetNum = parseInt(editBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert("נא להזין תקציב תקין");
      return;
    }

    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      let userId: string | undefined = session?.user?.id;
      if (!userId) {
        try {
          userId = JSON.parse(localStorage.getItem("user") || "{}").id;
        } catch {
          userId = undefined;
        }
      }
      
      if (!userId) {
        alert("נא להתחבר מחדש");
        return;
      }

      await updateProject(editingProject.id, { name: editName, budget: budgetNum }, userId);
      
      // Update local state
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, name: editName, budget: budgetNum }
          : p
      ));
      
      setEditingProject(null);
    } catch (err) {
      console.error("Failed to update project:", err);
      alert("שגיאה בעדכון הפרויקט");
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (!deleteConfirmProject) return;

    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      let userId: string | undefined = session?.user?.id;
      if (!userId) {
        try {
          userId = JSON.parse(localStorage.getItem("user") || "{}").id;
        } catch {
          userId = undefined;
        }
      }
      
      if (!userId) {
        alert("נא להתחבר מחדש");
        return;
      }

      await deleteProject(deleteConfirmProject.id, userId);
      
      // Update local state
      setProjects(projects.filter(p => p.id !== deleteConfirmProject.id));
      setDeleteConfirmProject(null);
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("שגיאה במחיקת הפרויקט");
    }
  };

  // Open edit modal
  const openEditModal = (project: DisplayProject) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditBudget(project.budget.toString());
    setProjectMenuOpen(null);
  };

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (isLoading || !user) {
    return <LoadingScreen text="טוען את האזור האישי..." tip={randomTip} />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="h-11 border-b border-stone-200/60 bg-white overflow-x-auto">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-full flex items-center gap-4 md:gap-6 min-w-max">
          <Link href="/" className="text-base font-semibold text-gray-900 hover:text-blue-600 whitespace-nowrap">
            ShiputzAI
          </Link>
          <Link href="/" className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap">דף הבית</Link>
          <Link href="/tips" className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap">
            מאמרים וטיפים
          </Link>
          {isAdmin && (
            <>
              <Link
                href="/admin"
                className="text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 px-2 md:px-3 py-1 rounded-full whitespace-nowrap"
              >
                📊 CRM
              </Link>
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`text-xs font-medium whitespace-nowrap ${showAdminPanel ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                🔧 Admin
              </button>
            </>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap"
          >
            ⚙️ הגדרות
          </button>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-900 whitespace-nowrap"
          >
            התנתקות
          </button>
        </div>
      </nav>

      {/* Admin Panel - Full Screen */}
      {isAdmin && showAdminPanel && user?.email && (
        <AdminPanel 
          onClose={() => setShowAdminPanel(false)} 
          adminEmail={user.email} 
        />
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-stone-800">
              {user.name ? `שלום, ${user.name}` : "הפרויקטים שלך"}
            </h1>
            {user.email && (
              <div className="flex items-center gap-3 mt-1">
                <p className="text-sm text-stone-500">{user.email}</p>
                {user.role && (
                  <>
                    <button
                      onClick={() => setShowRoleModal(true)}
                      className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors"
                    >
                      🔄 {(() => {
                        const labels: Record<string, string> = { homeowner: "בעל/ת בית", designer: "מעצב/ת פנים", architect: "אדריכל/ית", contractor: "קבלן", realtor: "נדל״ן", other: "אחר" };
                        return labels[user.role] || user.role;
                      })()}
                    </button>
                    <button
                      onClick={() => setViewMode(viewMode === 'role' ? 'all' : 'role')}
                      className="text-xs px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full hover:bg-stone-200 transition-colors"
                      title={viewMode === 'role' ? 'הצג את כל הכלים' : 'הצג כלים מותאמים'}
                    >
                      {viewMode === 'role' ? '👁️ הצג הכל' : '🎯 מותאם לי'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-stone-800 text-white px-6 py-2 rounded-full text-sm hover:bg-stone-700 transition-colors"
          >
            פרויקט חדש
          </button>
        </div>

        {/* Referral Widget */}
        {user?.email && <ReferralWidget userEmail={user.email} />}

        {/* Mini Stats Overview - Enhanced */}
        {projects.length > 0 && (
          <div className="mb-8">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-stone-200/80">
                <p className="text-xs text-stone-500 mb-1">סה״כ תקציב</p>
                <p className="text-2xl font-semibold text-stone-800">₪{totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200/80">
                <p className="text-xs text-stone-500 mb-1">סה״כ הוצאות</p>
                <p className="text-2xl font-semibold text-stone-800">₪{totalSpent.toLocaleString()}</p>
              </div>
              <div className={`p-5 rounded-xl border ${totalRemaining < 0 ? 'bg-rose-50/50 border-rose-200/60' : 'bg-white border-stone-200/80'}`}>
                <p className={`text-xs mb-1 ${totalRemaining < 0 ? 'text-rose-500' : 'text-stone-500'}`}>נותר</p>
                <p className={`text-2xl font-semibold ${totalRemaining < 0 ? 'text-rose-700' : 'text-stone-800'}`}>
                  ₪{totalRemaining.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200/80">
                <p className="text-xs text-stone-500 mb-1">פרויקטים</p>
                <p className="text-2xl font-semibold text-stone-800">{projects.length}</p>
              </div>
            </div>
            
          </div>
        )}

        {/* Account status line */}
        {(isPremium || hasVisionSub || hasLocalVision) && (
          <div className="mb-8 flex items-center gap-3 text-xs text-stone-500">
            {isPremium && <span className="bg-stone-100 px-3 py-1 rounded-full">✦ Pro</span>}
            {(hasVisionSub || hasLocalVision) && (
              <>
                <span className="bg-stone-100 px-3 py-1 rounded-full">הדמיות AI</span>
                {!visionSubInfo?.cancelAtPeriodEnd && (
                  <button onClick={() => setShowCancelModal(true)} className="text-stone-400 hover:text-stone-600 underline">בטל מנוי</button>
                )}
                {visionSubInfo?.cancelAtPeriodEnd && (
                  <span className="text-amber-500">יבוטל ב-{visionSubInfo.periodEnd ? new Date(visionSubInfo.periodEnd).toLocaleDateString('he-IL') : 'סוף התקופה'}</span>
                )}
              </>
            )}
          </div>
        )}

        {/* Projects */}
        {projectsLoading ? (
          <DashboardSkeleton />
        ) : projects.length === 0 ? (
          <div className="bg-white border border-stone-200/60 rounded-2xl p-16 shadow-sm text-center animate-fade-in-up">
            {/* Empty state illustration */}
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">אין פרויקטים עדיין</h2>
            <p className="text-gray-500 mb-8">צור את הפרויקט הראשון שלך והתחל לעקוב אחרי ההוצאות</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="bg-gray-900 text-white px-8 py-3 rounded-full text-base hover:bg-gray-800 transition-colors btn-press"
            >
              + צור פרויקט
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const percentage = (project.spent / project.budget) * 100;
              const remaining = project.budget - project.spent;
              const isOverBudget = remaining < 0;
              const isNearLimit = percentage > 80 && !isOverBudget;
              
              return (
                <div
                  key={project.id}
                  className="relative bg-white border border-stone-200/60 rounded-2xl p-8 hover:border-stone-300 hover:shadow-md shadow-sm transition-all duration-200"
                >
                  {/* Project Menu Button */}
                  <div className="absolute top-4 left-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectMenuOpen(projectMenuOpen === project.id ? null : project.id);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    {projectMenuOpen === project.id && (
                      <div className="absolute left-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-[140px] z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(project);
                          }}
                          className="w-full px-4 py-2 text-right text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span>✏️</span>
                          <span>עריכה</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmProject(project);
                            setProjectMenuOpen(null);
                          }}
                          className="w-full px-4 py-2 text-right text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <span>🗑️</span>
                          <span>מחיקה</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <Link href={`/project/${project.id}`} className="block">
                    <div className="flex items-start justify-between mb-6">
                      <h3 className="text-xl font-semibold text-stone-800">{project.name}</h3>
                      <span className={`text-sm px-3 py-1 rounded-full ${
                        isOverBudget ? 'bg-rose-50 text-rose-600' :
                        isNearLimit ? 'bg-amber-50 text-amber-600' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {percentage.toFixed(0)}% נוצל
                      </span>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                      <div>
                        <p className="text-sm text-stone-500 mb-1">תקציב</p>
                        <p className="text-lg font-medium text-stone-800">₪{project.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500 mb-1">הוצאות</p>
                        <p className="text-lg font-medium text-stone-800">₪{project.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-stone-500 mb-1">נותר</p>
                        <p className={`text-lg font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                          ₪{remaining.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 h-1 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-rose-400' :
                          isNearLimit ? 'bg-amber-400' :
                          'bg-stone-600'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project Wizard */}
      {showNewProject && (
        <NewProjectWizard
          onComplete={handleWizardComplete}
          onCancel={() => setShowNewProject(false)}
        />
      )}

      {/* Role Selection Modal for existing users */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <RoleSelector onSelect={async (role: Role) => {
              try {
                const { getSupabaseClient } = await import('@/lib/supabase');
                const supabase = getSupabaseClient();
                await supabase.auth.updateUser({ data: { role: role.key } });
                
                const userData = localStorage.getItem('user');
                if (userData) {
                  const u = JSON.parse(userData);
                  u.role = role.key;
                  localStorage.setItem('user', JSON.stringify(u));
                }
                
                setUser(prev => prev ? { ...prev, role: role.key } : prev);
                setShowRoleModal(false);
              } catch (err) {
                console.error('Failed to save role:', err);
                setShowRoleModal(false);
              }
            }} />
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              אולי אח״כ
            </button>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setEditingProject(null)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">עריכת פרויקט</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-500 mb-2">שם הפרויקט</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">תקציב (₪)</label>
                <input
                  type="number"
                  value={editBudget}
                  onChange={(e) => setEditBudget(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleEditProject}
                disabled={!editName || !editBudget}
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-base hover:bg-gray-800 transition-colors disabled:opacity-30"
              >
                שמור שינויים
              </button>
              <button
                onClick={() => setEditingProject(null)}
                className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full text-base hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setDeleteConfirmProject(null)}>
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🗑️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">מחיקת פרויקט</h2>
            <p className="text-gray-500 mb-2">
              האם אתה בטוח שברצונך למחוק את הפרויקט
            </p>
            <p className="text-gray-900 font-semibold mb-6">
              &quot;{deleteConfirmProject.name}&quot;?
            </p>
            <p className="text-red-500 text-sm mb-6">
              פעולה זו תמחק את כל ההוצאות, התמונות והנתונים של הפרויקט ולא ניתן לשחזר אותם.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={handleDeleteProject}
                className="flex-1 bg-red-600 text-white py-3 rounded-full text-base hover:bg-red-700 transition-colors"
              >
                כן, מחק
              </button>
              <button
                onClick={() => setDeleteConfirmProject(null)}
                className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full text-base hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center">
            {cancelSuccess ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">המנוי בוטל בהצלחה</h2>
                <p className="text-gray-500">
                  {hasVisionSub && visionSubInfo?.periodEnd 
                    ? `תוכל להמשיך להשתמש בשירות עד ${new Date(visionSubInfo.periodEnd).toLocaleDateString('he-IL')}`
                    : 'הגישה להדמיות הוסרה'}
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">⚠️</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">בטל מנוי הדמיות AI?</h2>
                <p className="text-gray-500 mb-6">
                  {hasVisionSub ? (
                    <>
                      המנוי יבוטל בסוף תקופת החיוב הנוכחית.
                      <br />
                      לא יחויב תשלום נוסף.
                    </>
                  ) : (
                    'הגישה להדמיות תבוטל מיידית.'
                  )}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelSubscription}
                    disabled={isCanceling}
                    className="flex-1 bg-red-600 text-white py-3 rounded-full text-base hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isCanceling ? 'מבטל...' : 'כן, בטל מנוי'}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(false)}
                    disabled={isCanceling}
                    className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full text-base hover:bg-gray-50 transition-colors"
                  >
                    חזור
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        userId={user?.id || ""}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen text="טוען..." />}>
      <DashboardContent />
    </Suspense>
  );
}
