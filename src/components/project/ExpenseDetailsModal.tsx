'use client';

import { useState } from 'react';
import { Expense, CATEGORIES } from '@/types';

interface ExpenseDetailsModalProps {
  expense: Expense;
  onClose: () => void;
  onDelete: (id: string) => void;
  onSave: (expense: Expense) => void;
}

export function ExpenseDetailsModal({ expense, onClose, onDelete, onSave }: ExpenseDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Expense>>({});

  const handleSave = () => {
    if (!editData.description || !editData.amount) return;
    onSave({ ...expense, ...editData } as Expense);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">פרטי הוצאה</h2>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Receipt Image */}
          {expense.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-100">
              <img 
                src={expense.imageUrl} 
                alt="קבלה" 
                className="w-full object-contain max-h-64"
              />
            </div>
          )}
          
          {/* Main Info */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">תיאור</label>
                  <input
                    type="text"
                    value={editData.description ?? expense.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">סכום (₪)</label>
                  <input
                    type="number"
                    value={editData.amount ?? expense.amount}
                    onChange={(e) => setEditData({...editData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">בעל מקצוע / עסק</label>
                  <input
                    type="text"
                    value={editData.vendor ?? expense.vendor ?? ''}
                    onChange={(e) => setEditData({...editData, vendor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">קטגוריה</label>
                  <select
                    value={editData.category ?? expense.category}
                    onChange={(e) => setEditData({...editData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                {(editData.fullText || expense.fullText) && (
                  <div>
                    <label className="text-sm text-gray-500 block mb-1">טקסט מלא מהקבלה</label>
                    <textarea
                      value={editData.fullText ?? expense.fullText ?? ''}
                      onChange={(e) => setEditData({...editData, fullText: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 text-sm"
                      rows={6}
                      dir="rtl"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">תיאור</p>
                    <p className="text-lg font-medium text-gray-900">{expense.description}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-500">סכום</p>
                    <p className="text-2xl font-bold text-gray-900">₪{expense.amount.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {expense.vendor && (
                    <div>
                      <p className="text-sm text-gray-500">בעל מקצוע / עסק</p>
                      <p className="font-medium text-gray-900">{expense.vendor}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">קטגוריה</p>
                    <p className="font-medium text-gray-900">{expense.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">תאריך הוספה</p>
                    <p className="font-medium text-gray-900">{new Date(expense.date).toLocaleDateString("he-IL")}</p>
                  </div>
                  {expense.invoiceDate && (
                    <div>
                      <p className="text-sm text-gray-500">תאריך חשבונית</p>
                      <p className="font-medium text-gray-900">{new Date(expense.invoiceDate).toLocaleDateString("he-IL")}</p>
                    </div>
                  )}
                  {expense.vatAmount && (
                    <div>
                      <p className="text-sm text-gray-500">מע״מ</p>
                      <p className="font-medium text-gray-900">₪{expense.vatAmount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Items Breakdown */}
          {expense.items && expense.items.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-3">פירוט פריטים</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                {expense.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name}
                      {item.quantity && item.quantity > 1 && ` (×${item.quantity})`}
                    </span>
                    {item.price && (
                      <span className="text-gray-900 font-medium">₪{item.price.toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Full Text from Receipt */}
          {expense.fullText && !isEditing && (
            <div>
              <p className="text-sm text-gray-500 mb-3">טקסט מלא מהקבלה</p>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{expense.fullText}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 space-y-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                className="w-full bg-blue-600 text-white py-3 rounded-full font-medium hover:bg-blue-700 transition-colors"
              >
                💾 שמור שינויים
              </button>
              <button 
                onClick={() => { setIsEditing(false); setEditData({}); }}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-300 transition-colors"
              >
                ביטול
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => { setIsEditing(true); setEditData(expense); }}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors border border-gray-200"
              >
                ✏️ ערוך פרטים
              </button>
              <button 
                onClick={() => onDelete(expense.id)}
                className="w-full bg-red-50 text-red-600 py-3 rounded-full font-medium hover:bg-red-100 transition-colors border border-red-100"
              >
                🗑️ מחק הוצאה
              </button>
              <button 
                onClick={onClose}
                className="w-full bg-gray-900 text-white py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
              >
                סגור
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
