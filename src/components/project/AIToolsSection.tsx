'use client';

interface AIToolsSectionProps {
  isPremium: boolean;
  onQuoteAnalysis: () => void;
  onAIChat: () => void;
  onScanReceipt: () => void;
}

export function AIToolsSection({ isPremium, onQuoteAnalysis, onAIChat, onScanReceipt }: AIToolsSectionProps) {
  return (
    <div className="border border-gray-100 rounded-2xl p-8 mb-8 print:hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">כלי AI</h2>
        {!isPremium && (
          <a href="/checkout" className="text-sm text-purple-600 hover:text-purple-700">
            🔒 דורש מנוי Premium
          </a>
        )}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={isPremium ? onQuoteAnalysis : undefined}
          disabled={!isPremium}
          className={`text-right bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all ${isPremium ? 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-gray-100 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
        >
          <p className="font-medium text-gray-900 mb-1">ניתוח הצעת מחיר</p>
          <p className="text-sm text-gray-500">בדוק אם המחיר סביר</p>
        </button>
        <button
          onClick={isPremium ? onAIChat : undefined}
          disabled={!isPremium}
          className={`text-right bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all ${isPremium ? 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-gray-100 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
        >
          <p className="font-medium text-gray-900 mb-1">עוזר AI</p>
          <p className="text-sm text-gray-500">שאל שאלות על השיפוץ</p>
        </button>
        <button
          onClick={isPremium ? onScanReceipt : undefined}
          disabled={!isPremium}
          className={`text-right bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all ${isPremium ? 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:bg-gray-100 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
        >
          <p className="font-medium text-gray-900 mb-1">סריקת קבלה</p>
          <p className="text-sm text-gray-500">צלם והוסף אוטומטית</p>
        </button>
      </div>
    </div>
  );
}
