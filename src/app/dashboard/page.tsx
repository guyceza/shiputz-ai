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

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="h-11 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/dashboard" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            התנתקות
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
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

        {/* Stats Overview */}
        {projects.length > 0 && (
          <div className="grid md:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden mb-12">
            <div className="bg-white p-8">
              <p className="text-sm text-gray-500 mb-1">סה״כ תקציב</p>
              <p className="text-2xl font-semibold text-gray-900">₪{totalBudget.toLocaleString()}</p>
            </div>
            <div className="bg-white p-8">
              <p className="text-sm text-gray-500 mb-1">סה״כ הוצאות</p>
              <p className="text-2xl font-semibold text-gray-900">₪{totalSpent.toLocaleString()}</p>
            </div>
            <div className="bg-white p-8">
              <p className="text-sm text-gray-500 mb-1">סה״כ נותר</p>
              <p className="text-2xl font-semibold text-gray-900">₪{totalRemaining.toLocaleString()}</p>
            </div>
          </div>
        )}

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
              
              return (
                <Link
                  key={project.id}
                  href={`/project/${project.id}`}
                  className="block border border-gray-100 rounded-2xl p-8 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                    <span className="text-sm text-gray-500">{percentage.toFixed(0)}% נוצל</span>
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
                      <p className="text-lg font-medium text-gray-900">₪{remaining.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-6 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-900 rounded-full transition-all"
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
