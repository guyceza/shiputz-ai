'use client';

import { useState, useRef } from 'react';
import { Expense, CATEGORIES } from '@/types';
import { ExpenseCard } from './ExpenseCard';

interface ExpenseListProps {
  expenses: Expense[];
  onSelectExpense: (expense: Expense) => void;
  onAddExpense: () => void;
  onExportCSV: () => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

export function ExpenseList({ 
  expenses, 
  onSelectExpense, 
  onAddExpense, 
  onExportCSV,
  onFileSelect
}: ExpenseListProps) {
  const [expenseFilter, setExpenseFilter] = useState<string>('all');
  const [expenseSort, setExpenseSort] = useState<SortOption>('date-desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get filtered and sorted expenses
  const getFilteredExpenses = () => {
    let filtered = [...expenses];
    
    // Filter by category
    if (expenseFilter !== 'all') {
      filtered = filtered.filter(e => e.category === expenseFilter);
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (expenseSort) {
        case 'date-desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc': return b.amount - a.amount;
        case 'amount-asc': return a.amount - b.amount;
        default: return 0;
      }
    });
    
    return filtered;
  };

  const filteredExpenses = getFilteredExpenses();

  return (
    <div className="border border-gray-100 rounded-2xl p-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">הוצאות</h2>
        <div className="flex gap-2 print:hidden">
          <button
            onClick={onExportCSV}
            className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-4 py-2 rounded-full"
          >
            ייצוא CSV
          </button>
          <button
            onClick={onAddExpense}
            className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800"
          >
            הוסף הוצאה
          </button>
        </div>
      </div>
      
      {/* Filters & Sort */}
      {expenses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 print:hidden">
          <select
            value={expenseFilter}
            onChange={(e) => setExpenseFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white"
          >
            <option value="all">כל הקטגוריות</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={expenseSort}
            onChange={(e) => setExpenseSort(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-full px-3 py-1.5 bg-white"
          >
            <option value="date-desc">תאריך (חדש → ישן)</option>
            <option value="date-asc">תאריך (ישן → חדש)</option>
            <option value="amount-desc">סכום (גבוה → נמוך)</option>
            <option value="amount-asc">סכום (נמוך → גבוה)</option>
          </select>
          {expenseFilter !== 'all' && (
            <span className="text-sm text-gray-500 self-center">
              {filteredExpenses.length} מתוך {expenses.length}
            </span>
          )}
        </div>
      )}

      <input 
        ref={fileInputRef} 
        type="file" 
        accept="image/*" 
        multiple 
        onChange={onFileSelect} 
        className="hidden" 
      />

      {expenses.length === 0 ? (
        <p className="text-gray-500 text-center py-12">אין הוצאות עדיין</p>
      ) : filteredExpenses.length === 0 ? (
        <p className="text-gray-500 text-center py-12">אין הוצאות בקטגוריה זו</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {filteredExpenses.map((expense) => (
            <ExpenseCard
              key={expense.id}
              expense={expense}
              onClick={() => onSelectExpense(expense)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
