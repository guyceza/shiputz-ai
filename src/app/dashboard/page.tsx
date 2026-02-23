"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminPanel from "./admin-panel";
import { 
  getProjects, 
  createProject, 
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email: string; id?: string } | null>(null);
  const [projects, setProjects] = useState<DisplayProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
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

  // Random tip that changes on refresh
  const randomTip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

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
              fetch(`/api/whop/cancel-subscription?email=${email}`).catch(() => null)
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
          const parsedUser = JSON.parse(userData);
          userId = parsedUser.id;
          setUser(parsedUser);
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
          
          // Check for localStorage Vision (legacy users)
          const localVision = localStorage.getItem(`visualize_subscription_${userId}`);
          if (localVision === 'active') {
            setHasLocalVision(true);
          }
        }
      } catch (e) {
        console.error("Auth check error:", e);
        // Fallback to localStorage
        const userData = localStorage.getItem("user");
        if (!userData) {
          router.push("/login");
          return;
        }
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
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleCancelSubscription = async () => {
    if (!user?.email && !user?.id) return;
    
    setIsCanceling(true);
    
    // If it's a localStorage Vision (not Whop), just remove from localStorage
    if (hasLocalVision && !hasVisionSub) {
      localStorage.removeItem(`visualize_subscription_${user.id}`);
      setCancelSuccess(true);
      setHasLocalVision(false);
      setTimeout(() => {
        setShowCancelModal(false);
        setCancelSuccess(false);
      }, 2000);
      setIsCanceling(false);
      return;
    }
    
    // Otherwise, cancel via Whop API
    try {
      const res = await fetch('/api/whop/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      if (res.ok) {
        const data = await res.json();
        setCancelSuccess(true);
        setVisionSubInfo({
          cancelAtPeriodEnd: true,
          periodEnd: data.periodEnd
        });
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
      const userId = session?.user?.id || JSON.parse(localStorage.getItem("user") || "{}").id;
      
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

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center">
        {/* Logo */}
        <div className="text-3xl font-bold text-gray-900 mb-8">ShiputzAI</div>
        
        {/* Animated Spinner */}
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading Text */}
        <div className="text-gray-600 font-medium mb-2">טוען את האזור האישי...</div>
        <div className="text-gray-400 text-sm">{randomTip}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-base font-semibold text-gray-900 hover:text-blue-600">
              ShiputzAI
            </Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">דף הבית</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-500 hover:text-gray-900">
              מאמרים וטיפים
            </Link>
            {isAdmin && (
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="text-xs font-medium text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1 rounded-full"
                >
                  📊 CRM
                </Link>
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className={`text-xs font-medium ${showAdminPanel ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  🔧 Admin
                </button>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              התנתקות
            </button>
          </div>
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
            className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm hover:bg-gray-800 transition-colors"
          >
            פרויקט חדש
          </button>
        </div>

        {/* Mini Stats Overview - Enhanced */}
        {projects.length > 0 && (
          <div className="mb-8">
            <div className="grid md:grid-cols-4 gap-px bg-gray-100 rounded-2xl overflow-hidden">
              <div className="bg-white p-6">
                <p className="text-xs text-gray-500 mb-1">סה״כ תקציב</p>
                <p className="text-2xl font-bold text-gray-900">₪{totalBudget.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-xs text-gray-500 mb-1">סה״כ הוצאות</p>
                <p className="text-2xl font-bold text-gray-900">₪{totalSpent.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6">
                <p className="text-xs text-gray-500 mb-1">נותר</p>
                <p className={`text-2xl font-bold ${totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₪{totalRemaining.toLocaleString()}
                </p>
              </div>
              <div className="bg-white p-6">
                <p className="text-xs text-gray-500 mb-1">פרויקטים</p>
                <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  spentPercentage > 90 ? 'bg-red-500' : 
                  spentPercentage > 70 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">{spentPercentage.toFixed(0)}% מהתקציב נוצל</p>
          </div>
        )}

        {/* Did You Know? Tip Box */}
        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-xs font-medium text-blue-600 mb-1">הידעת?</p>
              <p className="text-gray-700 text-sm leading-relaxed">{randomTip}</p>
            </div>
            <Link 
              href="/tips"
              className="text-xs text-blue-600 hover:text-blue-700 whitespace-nowrap"
            >
              עוד טיפים ←
            </Link>
          </div>
        </div>

        {/* Premium Status - One time purchase (no cancel needed) */}
        {isPremium && (
          <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">✨ מנוי פרימיום פעיל</p>
                <p className="text-xs text-purple-600">יש לך גישה לכל הפיצ׳רים המתקדמים</p>
              </div>
              <span className="text-xs text-purple-500 bg-purple-100 px-3 py-1 rounded-full">
                רכישה חד-פעמית
              </span>
            </div>
          </div>
        )}

        {/* Vision AI Subscription - Monthly (can cancel) */}
        {(hasVisionSub || hasLocalVision) && (
          <div className="mb-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-900 mb-1">🎨 מנוי הדמיות AI פעיל</p>
                {visionSubInfo?.cancelAtPeriodEnd ? (
                  <p className="text-xs text-amber-600">
                    יבוטל ב-{visionSubInfo.periodEnd ? new Date(visionSubInfo.periodEnd).toLocaleDateString('he-IL') : 'סוף התקופה'}
                  </p>
                ) : hasVisionSub ? (
                  <p className="text-xs text-emerald-600">מתחדש אוטומטית כל חודש</p>
                ) : (
                  <p className="text-xs text-emerald-600">גישה מלאה להדמיות</p>
                )}
              </div>
              {!visionSubInfo?.cancelAtPeriodEnd && (hasLocalVision || hasVisionSub) && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-sm text-red-600 hover:text-red-700 border border-red-200 px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
                >
                  בטל מנוי
                </button>
              )}
            </div>
          </div>
        )}

        {/* Projects */}
        {projectsLoading ? (
          <div className="border border-gray-100 rounded-2xl p-16 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">טוען פרויקטים...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="border border-gray-100 rounded-2xl p-16 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">אין פרויקטים עדיין</h2>
            <p className="text-gray-500 mb-8">צור את הפרויקט הראשון שלך והתחל לעקוב אחרי ההוצאות</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="bg-gray-900 text-white px-8 py-3 rounded-full text-base hover:bg-gray-800 transition-colors"
            >
              צור פרויקט
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
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="block border border-gray-100 rounded-2xl p-8 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      isOverBudget ? 'bg-red-100 text-red-700' :
                      isNearLimit ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-600'
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
                  <div className="mt-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' :
                        isNearLimit ? 'bg-amber-500' :
                        'bg-gray-900'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </Link>
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
    </div>
  );
}
