'use client';

import { Expense } from '@/types';

interface ExpenseCardProps {
  expense: Expense;
  onClick: () => void;
}

export function ExpenseCard({ expense, onClick }: ExpenseCardProps) {
  return (
    <div 
      className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {expense.imageUrl && (
          <img src={expense.imageUrl} alt="" className="w-10 h-10 object-cover rounded-lg print:hidden" />
        )}
        <div>
          <p className="font-medium text-gray-900">{expense.description}</p>
          <p className="text-sm text-gray-500">
            {expense.vendor ? `${expense.vendor} · ` : ""}{expense.category} · {new Date(expense.date).toLocaleDateString("he-IL")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="font-medium text-gray-900">₪{expense.amount.toLocaleString()}</p>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}
