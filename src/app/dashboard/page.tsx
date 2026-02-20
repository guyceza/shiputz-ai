"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  budget: number;
  spent: number;
  createdAt: string;
  expenses?: { amount: number; category: string; date: string }[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectBudget, setNewProjectBudget] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(userData));

    const savedProjects = localStorage.getItem("projects");
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, [router]);

  const handleCreateProject = () => {
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
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
    setShowNewProject(false);
    setNewProjectName("");
    setNewProjectBudget("");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  // Calculate totals
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="h-11 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/dashboard" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            התנתקות
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold">שלום{user.name ? `, ${user.name}` : ""}</h1>
            <p className="text-gray-500 mt-1">ניהול השיפוצים שלך</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors"
          >
            פרויקט חדש
          </button>
        </div>

        {/* Stats Overview */}
        {projects.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">סה"כ תקציב</p>
              <p className="text-2xl font-semibold">₪{totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">סה"כ הוצאות</p>
              <p className="text-2xl font-semibold">₪{totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-2xl p-6">
              <p className="text-sm text-gray-500 mb-1">סה"כ נותר</p>
              <p className={`text-2xl font-semibold ${totalRemaining < 0 ? "text-red-600" : "text-green-600"}`}>
                ₪{totalRemaining.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">ברוכים הבאים ל-ShiputzAI</h2>
              <p className="text-gray-500 mb-6">
                צור את הפרויקט הראשון שלך ותתחיל לנהל את השיפוץ בצורה חכמה
              </p>
              <button
                onClick={() => setShowNewProject(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-full text-base hover:bg-blue-700 transition-colors"
              >
                צור פרויקט ראשון
              </button>
              
              <div className="mt-12 pt-8 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-4">מה תוכל לעשות:</p>
                <div className="grid gap-4 text-right">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">מעקב תקציב</p>
                      <p className="text-sm text-gray-500">ראה בדיוק כמה הוצאת וכמה נשאר</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">סריקת קבלות</p>
                      <p className="text-sm text-gray-500">צלם קבלה וה-AI יוסיף אוטומטית</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">ניתוח הצעות מחיר</p>
                      <p className="text-sm text-gray-500">בדוק אם המחירים הוגנים לפני שחותם</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold mb-4">הפרויקטים שלך</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const percentage = (project.spent / project.budget) * 100;
                const isOverBudget = percentage > 100;
                const isWarning = percentage > 70 && percentage <= 100;
                
                return (
                  <Link
                    key={project.id}
                    href={`/project/${project.id}`}
                    className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      {isOverBudget && (
                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                          חריגה
                        </span>
                      )}
                      {isWarning && (
                        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">
                          שים לב
                        </span>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">תקציב</span>
                        <span className="font-medium">₪{project.budget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">הוצאות</span>
                        <span className="font-medium">₪{project.spent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">נותר</span>
                        <span className={`font-medium ${project.budget - project.spent < 0 ? "text-red-600" : "text-green-600"}`}>
                          ₪{(project.budget - project.spent).toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOverBudget
                              ? "bg-red-500"
                              : isWarning
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-left">
                        {percentage.toFixed(0)}% נוצל
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Tips Section */}
            <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
              <h3 className="text-lg font-semibold mb-4">טיפים לשיפוץ מוצלח</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="font-medium mb-1">תכנון מראש</p>
                  <p className="text-sm text-white/80">השאר 10-15% מהתקציב לבלת"מים</p>
                </div>
                <div>
                  <p className="font-medium mb-1">תיעוד</p>
                  <p className="text-sm text-white/80">צלם כל קבלה ושמור כל חוזה</p>
                </div>
                <div>
                  <p className="font-medium mb-1">בקרה</p>
                  <p className="text-sm text-white/80">בדוק את ההוצאות פעם בשבוע</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">פרויקט חדש</h2>
            <p className="text-gray-500 mb-6">הגדר את פרטי השיפוץ</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">שם הפרויקט</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="לדוגמה: שיפוץ מטבח"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">תקציב (₪)</label>
                <input
                  type="number"
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(e.target.value)}
                  placeholder="100000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:border-blue-600"
                />
                <p className="text-xs text-gray-400 mt-1">טיפ: השאר 10-15% רזרבה לבלת"מים</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName || !newProjectBudget}
                className="flex-1 bg-blue-600 text-white py-3 rounded-full text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                צור פרויקט
              </button>
              <button
                onClick={() => setShowNewProject(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-full text-base font-medium hover:bg-gray-200 transition-colors"
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
