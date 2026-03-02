"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanel from "./admin-panel";
import { DashboardSkeleton } from "@/components/Skeleton";
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
  "בקש מהקבלן אחריות בכתב על העבודה - רוב הקבלנים הטובים נותנים שנה לפחות.",
  "תמיד השאר 10-15% מהתקציב לבלת״מים - הם תמיד מגיעים בשיפוץ.",
  "צלם כל שלב בעבודה - זה יעזור אם יהיו בעיות בעתיד.",
  "אל תשלם יותר מ-30% מראש - עדיף לשלם לפי התקדמות.",
  "בדוק שהקבלן רשום בפנקס הקבלנים לפני שסוגרים.",
  "קבל לפחות 3 הצעות מחיר לפני שמחליטים - ההבדלים יפתיעו אותך.",
  "וודא שיש לקבלן ביטוח צד ג׳ - זה חובה חוקית.",
  "תכנן את לוח הזמנים עם באפר של 20% - עיכובים הם נורמה בשיפוצים."
];

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const [user, setUser] = useState<{ name?: string; email: string; id?: string } | null>(null);
  const [projects, setProjects] = useState<DisplayProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
          setUser({ 
            id: session.user.id,
            email: session.user.email || "", 
            name: session.user.user_metadata?.name 
          });
          // Check if admin
          if (session.user.email === "guyceza@gmail.com") {
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

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectBudget) return;
    
    const budgetNum = parseInt(newProjectBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      alert("נא להזין תקציב תקין");
      return;
    }

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
      const newProject = await createProject(userId, newProjectName, budgetNum);
      
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
            <h1 className="text-3xl font-semibold text-gray-900">
              {user.name ? `שלום, ${user.name}` : "הפרויקטים שלך"}
            </h1>
            {user.email && (
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-stone-800 text-white px-6 py-2 rounded-full text-sm hover:bg-stone-700 transition-colors"
          >
            פרויקט חדש
          </button>
        </div>

        {/* Mini Stats Overview - Enhanced */}
        {projects.length > 0 && (
          <div className="mb-8">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
                <p className="text-xs text-stone-500 mb-1">סה״כ תקציב</p>
                <p className="text-2xl font-semibold text-stone-800">₪{totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
                <p className="text-xs text-stone-500 mb-1">סה״כ הוצאות</p>
                <p className="text-2xl font-semibold text-stone-800">₪{totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
                <p className="text-xs text-stone-500 mb-1">נותר</p>
                <p className={`text-2xl font-semibold ${totalRemaining < 0 ? 'text-rose-600' : 'text-stone-800'}`}>
                  ₪{totalRemaining.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-stone-200/60 shadow-sm">
                <p className="text-xs text-stone-500 mb-1">פרויקטים</p>
                <p className="text-2xl font-semibold text-stone-800">{projects.length}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 bg-stone-200/50 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  spentPercentage > 90 ? 'bg-rose-400' : 
                  spentPercentage > 70 ? 'bg-amber-400' : 'bg-stone-600'
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-stone-400 mt-2 text-center">{spentPercentage.toFixed(0)}% מהתקציב נוצל</p>
          </div>
        )}

        {/* Did You Know? Tip Box */}
        <div className="mb-8 bg-white rounded-2xl p-6 border border-stone-200/60 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-stone-700 mb-1">הידעת?</p>
              <p className="text-stone-600 text-sm leading-relaxed">{randomTip}</p>
            </div>
            <Link 
              href="/tips"
              className="text-xs text-stone-500 hover:text-stone-800 whitespace-nowrap"
            >
              עוד טיפים ←
            </Link>
          </div>
        </div>

        {/* Premium Status - One time purchase (no cancel needed) */}
        {isPremium && (
          <div className="mb-8 bg-gradient-to-l from-stone-800 to-stone-900 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-100 mb-1">מנוי פרימיום פעיל</p>
                <p className="text-xs text-stone-400">יש לך גישה לכל הפיצ׳רים המתקדמים</p>
              </div>
              <span className="text-xs text-stone-400 bg-stone-700/50 px-3 py-1 rounded-full">
                רכישה חד-פעמית
              </span>
            </div>
          </div>
        )}

        {/* Vision AI Subscription - Monthly (can cancel) */}
        {(hasVisionSub || hasLocalVision) && (
          <div className="mb-8 bg-white rounded-2xl p-6 border border-stone-200/60 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">מנוי הדמיות AI פעיל</p>
                {visionSubInfo?.cancelAtPeriodEnd ? (
                  <p className="text-xs text-amber-600">
                    יבוטל ב-{visionSubInfo.periodEnd ? new Date(visionSubInfo.periodEnd).toLocaleDateString('he-IL') : 'סוף התקופה'}
                  </p>
                ) : hasVisionSub ? (
                  <p className="text-xs text-gray-500">מתחדש אוטומטית כל חודש</p>
                ) : (
                  <p className="text-xs text-gray-500">גישה מלאה להדמיות</p>
                )}
              </div>
              {!visionSubInfo?.cancelAtPeriodEnd && (hasLocalVision || hasVisionSub) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors"
                >
                  בטל מנוי
                </button>
              )}
            </div>
          </div>
        )}

        {/* Premium Tools Section */}
        {isPremium && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-stone-800 mb-4">כלים מתקדמים</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Bill of Quantities */}
              <Link 
                href="/dashboard/bill-of-quantities"
                className="group bg-white border border-stone-200/60 rounded-2xl p-6 hover:border-stone-300 hover:shadow-md transition-all shadow-sm"
              >
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-800 mb-1">כתב כמויות AI</h3>
                <p className="text-sm text-stone-500">העלה תכנית וקבל כתב כמויות מפורט אוטומטית</p>
                <span className="inline-block mt-3 text-xs text-stone-500 group-hover:text-stone-800 group-hover:underline">
                  התחל עכשיו ←
                </span>
              </Link>

              {/* Visualize */}
              {(hasVisionSub || hasLocalVision) ? (
                <Link 
                  href="/visualize"
                  className="group bg-white border border-stone-200/60 rounded-2xl p-6 hover:border-stone-300 hover:shadow-md transition-all shadow-sm"
                >
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-1">הדמיות AI</h3>
                  <p className="text-sm text-stone-500">צור הדמיה של השיפוץ לפני שמתחילים</p>
                  <span className="inline-block mt-3 text-xs text-stone-500 group-hover:text-stone-800 group-hover:underline">
                    צור הדמיה ←
                  </span>
                </Link>
              ) : (
                <Link href="/visualize" className="group bg-white border border-stone-200/60 rounded-2xl p-6 hover:border-stone-300 hover:shadow-md transition-all shadow-sm">
                  <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-stone-800 mb-1">הדמיות AI</h3>
                  <p className="text-sm text-stone-500">צור הדמיה של השיפוץ לפני שמתחילים</p>
                  <span className="inline-block mt-3 text-xs text-stone-400 group-hover:underline">
                    נדרש מנוי AI Vision ←
                  </span>
                </Link>
              )}

              {/* Quote Analysis */}
              <Link 
                href={projects.length > 0 ? `/project/${projects[0].id}?tab=quote` : "/dashboard"}
                className={`group border border-gray-200 rounded-2xl p-6 hover:border-gray-400 hover:shadow-lg transition-all ${projects.length === 0 ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-stone-800 mb-1">ניתוח הצעות מחיר</h3>
                <p className="text-sm text-stone-500">השווה הצעות וקבל המלצות AI</p>
                <span className="inline-block mt-3 text-xs text-stone-500 group-hover:text-stone-800 group-hover:underline">
                  {projects.length > 0 ? 'נתח הצעה ←' : 'צור פרויקט קודם'}
                </span>
              </Link>
            </div>
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
            
            <div className="mt-16 pt-12 border-t border-gray-100 text-right max-w-md mx-auto">
              <p className="text-sm text-gray-500 mb-6">מה תוכל לעשות:</p>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <span className="text-gray-400">—</span>
                  <div>
                    <p className="font-medium text-gray-900">מעקב תקציב</p>
                    <p className="text-sm text-gray-500">ראה בדיוק כמה הוצאת וכמה נשאר</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-400">—</span>
                  <div>
                    <p className="font-medium text-gray-900">סריקת קבלות</p>
                    <p className="text-sm text-gray-500">צלם קבלה וה-AI יוסיף אוטומטית</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-400">—</span>
                  <div>
                    <p className="font-medium text-gray-900">ניתוח הצעות</p>
                    <p className="text-sm text-gray-500">בדוק אם המחירים הוגנים</p>
                  </div>
                </div>
              </div>
            </div>
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
                      <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
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
                        <p className="text-sm text-gray-500 mb-1">תקציב</p>
                        <p className="text-lg font-medium text-gray-900">₪{project.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">הוצאות</p>
                        <p className="text-lg font-medium text-gray-900">₪{project.spent.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">נותר</p>
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

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8">פרויקט חדש</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-gray-500 mb-2">שם הפרויקט</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="לדוגמה: שיפוץ מטבח"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-2">תקציב (₪)</label>
                <input
                  type="number"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                  placeholder="100000"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName || !newProjectBudget}
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-base hover:bg-gray-800 transition-colors disabled:opacity-30"
              >
                צור
              </button>
              <button
                onClick={() => setShowNewProject(false)}
                className="flex-1 border border-gray-200 text-gray-900 py-3 rounded-full text-base hover:bg-gray-50 transition-colors"
              >
                ביטול
              </button>
            </div>
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
