'use client';

import { Project, CATEGORIES } from '@/types';

interface BudgetOverviewProps {
  project: Project;
  onOpenBudgetModal: () => void;
}

export function BudgetOverview({ project, onOpenBudgetModal }: BudgetOverviewProps) {
  // Calculate expenses by category
  const getExpensesByCategory = () => {
    if (!project?.expenses) return {};
    return project.expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
  };

  // Check budget alerts
  const getBudgetAlerts = () => {
    if (!project?.categoryBudgets) return [];
    const expensesByCategory = getExpensesByCategory();
    return project.categoryBudgets.filter(cb => {
      const spent = expensesByCategory[cb.category] || 0;
      return spent > cb.allocated && cb.allocated > 0;
    }).map(cb => ({
      category: cb.category,
      allocated: cb.allocated,
      spent: expensesByCategory[cb.category] || 0,
      over: (expensesByCategory[cb.category] || 0) - cb.allocated
    }));
  };

  const budgetPercentage = (project.spent / project.budget) * 100;
  const remaining = project.budget - project.spent;
  const expensesByCategory = getExpensesByCategory();
  const budgetAlerts = getBudgetAlerts();
  const maxCategoryExpense = Math.max(...Object.values(expensesByCategory), 1);

  return (
    <>
      {/* Budget Overview Grid */}
      <div className="grid md:grid-cols-3 gap-px bg-gray-100 rounded-2xl overflow-hidden mb-8">
        <div className="bg-white p-8">
          <p className="text-sm text-gray-500 mb-1">תקציב</p>
          <p className="text-3xl font-semibold text-gray-900">₪{project.budget.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8">
          <p className="text-sm text-gray-500 mb-1">הוצאות</p>
          <p className="text-3xl font-semibold text-gray-900">₪{project.spent.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8">
          <p className="text-sm text-gray-500 mb-1">נותר</p>
          <p className={`text-3xl font-semibold ${remaining < 0 ? "text-red-600" : "text-gray-900"}`}>
            ₪{remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>התקדמות</span>
          <span>{budgetPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${budgetPercentage > 100 ? "bg-red-500" : "bg-gray-900"}`} 
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }} 
          />
        </div>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <p className="font-semibold text-red-800 mb-3">⚠️ התראות חריגה מתקציב</p>
          <div className="space-y-2">
            {budgetAlerts.map(alert => (
              <p key={alert.category} className="text-sm text-red-700">
                {alert.category}: חריגה של ₪{alert.over.toLocaleString()} (הוקצה ₪{alert.allocated.toLocaleString()}, הוצאו ₪{alert.spent.toLocaleString()})
              </p>
            ))}
          </div>
        </div>
      )}

      {/* General Alert */}
      {budgetPercentage > 80 && (
        <div className="border border-gray-900 rounded-2xl p-6 mb-8">
          <p className="font-medium text-gray-900">שים לב</p>
          <p className="text-sm text-gray-600 mt-1">
            {budgetPercentage > 100 
              ? `חרגת מהתקציב ב-₪${Math.abs(remaining).toLocaleString()}`
              : `נשארו ₪${remaining.toLocaleString()} מתוך התקציב (${(100 - budgetPercentage).toFixed(0)}%)`
            }
          </p>
        </div>
      )}

      {/* Category Budget Chart */}
      <div className="border border-gray-100 rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">הוצאות לפי קטגוריה</h2>
          <button
            onClick={onOpenBudgetModal}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-full"
          >
            הגדר תקציב לקטגוריות
          </button>
        </div>
        
        {Object.keys(expensesByCategory).length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין הוצאות עדיין</p>
        ) : (
          <div className="space-y-4">
            {CATEGORIES.filter(cat => expensesByCategory[cat] || project.categoryBudgets?.find(cb => cb.category === cat)?.allocated).map(cat => {
              const spent = expensesByCategory[cat] || 0;
              const allocated = project.categoryBudgets?.find(cb => cb.category === cat)?.allocated || 0;
              const barWidth = (spent / (allocated || maxCategoryExpense)) * 100;
              const isOver = allocated > 0 && spent > allocated;
              
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{cat}</span>
                    <span className={isOver ? "text-red-600 font-medium" : "text-gray-500"}>
                      ₪{spent.toLocaleString()}
                      {allocated > 0 && ` / ₪${allocated.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : "bg-gray-700"}`}
                      style={{ width: `${Math.min(barWidth, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
