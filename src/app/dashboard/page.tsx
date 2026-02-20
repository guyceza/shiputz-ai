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
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold">שלום{user.name ? `, ${user.name}` : ""}</h1>
            <p className="text-gray-500 mt-1">הפרויקטים שלך</p>
          </div>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors"
          >
            פרויקט חדש
          </button>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-500 mb-4">אין לך פרויקטים עדיין</p>
            <button
              onClick={() => setShowNewProject(true)}
              className="text-blue-600 hover:underline"
            >
              צור פרויקט ראשון
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/project/${project.id}`}
                className="bg-white rounded-2xl p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">תקציב</span>
                    <span className="font-medium">₪{project.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">הוצאות</span>
                    <span className="font-medium">₪{project.spent.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        project.spent / project.budget > 0.9
                          ? "bg-red-500"
                          : project.spent / project.budget > 0.7
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-6">פרויקט חדש</h2>
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
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleCreateProject}
                className="flex-1 bg-blue-600 text-white py-3 rounded-full text-base font-medium hover:bg-blue-700 transition-colors"
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
