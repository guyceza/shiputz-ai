"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
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
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetList, setResetList] = useState<string[]>([]);
  const [adminMessage, setAdminMessage] = useState("");

  // Random tip that changes on refresh
  const randomTip = useMemo(() => TIPS[Math.floor(Math.random() * TIPS.length)], []);

  // Admin functions
  const loadResetList = async () => {
    try {
      const res = await fetch("/api/admin/trial-reset");
      const data = await res.json();
      setResetList(data.list || []);
    } catch (e) {
      console.error("Failed to load reset list:", e);
    }
  };

  const addToResetList = async () => {
    if (!resetEmail || !user?.email) return;
    try {
      const res = await fetch("/api/admin/trial-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, adminEmail: user.email })
      });
      const data = await res.json();
      if (data.success) {
        setResetList(data.list);
        setAdminMessage(`✅ ${resetEmail} נוסף - הניסיון יתאפס בכניסה הבאה`);
        setResetEmail("");
      }
    } catch (e) {
      setAdminMessage("❌ שגיאה");
    }
    setTimeout(() => setAdminMessage(""), 3000);
  };

  const removeFromResetList = async (email: string) => {
    if (!user?.email) return;
    try {
      const res = await fetch("/api/admin/trial-reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, adminEmail: user.email })
      });
      const data = await res.json();
      if (data.success) {
        setResetList(data.list);
      }
    } catch (e) {
      console.error("Failed to remove:", e);
    }
  };

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
            loadResetList();
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

        // Load projects for THIS user only
        if (userId) {
          const savedProjects = localStorage.getItem(`projects_${userId}`);
          if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
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
        
        // Load projects for THIS user only
        if (parsedUser.id) {
          const savedProjects = localStorage.getItem(`projects_${parsedUser.id}`);
          if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
          }
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleCreateProject = async () => {
    if (!newProjectName || !newProjectBudget) return;

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      budget: parseInt(newProjectBudget),
      spent: 0,
      createdAt: new Date().toISOString(),
    };

    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    
    // Save with user-specific key
    try {
      const { getSession } = await import("@/lib/auth");
      const session = await getSession();
      const userId = session?.user?.id || JSON.parse(localStorage.getItem("user") || "{}").id;
      if (userId) {
        localStorage.setItem(`projects_${userId}`, JSON.stringify(updatedProjects));
      }
    } catch {
      // Fallback - try to get from localStorage user
      const userData = localStorage.getItem("user");
      if (userData) {
        const userId = JSON.parse(userData).id;
        if (userId) {
          localStorage.setItem(`projects_${userId}`, JSON.stringify(updatedProjects));
        }
      }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">טוען...</div>
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
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className={`text-xs font-medium ${showAdminPanel ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              >
                🔧 Admin
              </button>
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

      {/* Admin Panel */}
      {isAdmin && showAdminPanel && (
        <div className="bg-gray-900 text-white">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">🔧 פאנל ניהול</h2>
              <button onClick={() => setShowAdminPanel(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            {adminMessage && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${adminMessage.startsWith('✅') ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                {adminMessage}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Reset Trial */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-medium mb-3">איפוס ניסיון חינמי</h3>
                <div className="flex gap-2 mb-3">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                  <button
                    onClick={addToResetList}
                    disabled={!resetEmail}
                    className="px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    אפס
                  </button>
                </div>
                {resetList.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 mb-2">ממתינים ({resetList.length}):</p>
                    {resetList.map(email => (
                      <div key={email} className="flex items-center justify-between bg-gray-700 px-3 py-2 rounded text-sm">
                        <span dir="ltr">{email}</span>
                        <button onClick={() => removeFromResetList(email)} className="text-red-400 hover:text-red-300">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="font-medium mb-3">סטטיסטיקות</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <p>ממתינים לאיפוס: {resetList.length}</p>
                  <p>פרויקטים שלך: {projects.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">
              {user.name ? `שלום, ${user.name}` : "הפרויקטים שלך"}
            </h1>
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

        {/* Projects */}
        {projects.length === 0 ? (
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
    </div>
  );
}
