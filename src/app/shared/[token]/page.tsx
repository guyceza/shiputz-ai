"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ProjectData {
  name: string;
  budget: number;
  spent: number;
  expenses?: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    date: string;
    vendor?: string;
  }>;
  categoryBudgets?: Array<{
    category: string;
    allocated: number;
  }>;
}

interface SharedProject {
  id: string;
  name: string;
  budget: number;
  spent: number;
  data: ProjectData;
}

export default function SharedProjectPage() {
  const params = useParams();
  const [project, setProject] = useState<SharedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedProject = async () => {
      try {
        const res = await fetch(`/api/share?token=${params.token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "שגיאה בטעינת הפרויקט");
          return;
        }

        setProject(data.project);
      } catch (e) {
        setError("שגיאה בטעינת הפרויקט");
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      fetchSharedProject();
    }
  }, [params.token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרויקט משותף...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-500 mb-6">
            {error.includes("expired") 
              ? "הקישור פג תוקף. בקש מבעל הפרויקט קישור חדש."
              : "הקישור אינו תקין או שהפרויקט לא נמצא."
            }
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const projectData = project.data || {};
  const budget = project.budget || 0;
  const spent = project.spent || 0;
  const budgetPercentage = budget > 0 ? (spent / budget) * 100 : 0;
  const remaining = budget - spent;

  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  (projectData.expenses || []).forEach(exp => {
    expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">📤 תצוגת צפייה בלבד</p>
            <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
          </div>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ShiputzAI
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Budget Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">תקציב</p>
            <p className="text-2xl font-semibold text-gray-900">₪{budget.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">הוצאות</p>
            <p className="text-2xl font-semibold text-gray-900">₪{spent.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 text-center">
            <p className="text-sm text-gray-500 mb-1">נותר</p>
            <p className={`text-2xl font-semibold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
              ₪{remaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-6 mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>התקדמות</span>
            <span>{budgetPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${budgetPercentage > 100 ? "bg-red-500" : "bg-blue-500"}`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Expenses by Category */}
        {Object.keys(expensesByCategory).length > 0 && (
          <div className="bg-white rounded-2xl p-6 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">הוצאות לפי קטגוריה</h2>
            <div className="space-y-3">
              {Object.entries(expensesByCategory)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-medium text-gray-900">₪{amount.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Expenses */}
        {projectData.expenses && projectData.expenses.length > 0 && (
          <div className="bg-white rounded-2xl p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              הוצאות אחרונות ({projectData.expenses.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {projectData.expenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((expense) => (
                  <div key={expense.id} className="py-3 flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-500">
                        {expense.category}
                        {expense.vendor && ` • ${expense.vendor}`}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">₪{expense.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(expense.date).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-400">
          <p>קישור זה לצפייה בלבד</p>
          <p className="mt-1">
            רוצה לנהל פרויקט משלך?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              הרשמה חינם
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
