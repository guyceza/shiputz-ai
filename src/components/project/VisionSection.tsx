'use client';

interface VisionSectionProps {
  hasVisionSub: boolean;
  remainingVisions: number;
  onCreateVision: () => void;
}

export function VisionSection({ hasVisionSub, remainingVisions, onCreateVision }: VisionSectionProps) {
  return (
    <div className="border border-gray-100 rounded-2xl p-8 mb-8 print:hidden bg-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">איך השיפוץ שלי יראה?</h2>
            <p className="text-sm text-gray-500">ראה את השיפוץ לפני שמתחיל</p>
          </div>
        </div>
        {hasVisionSub && (
          <div className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200">
            נשארו לך <span className="font-semibold text-gray-900">{remainingVisions}</span> עריכות בחודש
          </div>
        )}
      </div>
      {hasVisionSub ? (
        <button
          onClick={onCreateVision}
          className="w-full bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-all"
        >
          צור הדמיה חדשה
        </button>
      ) : (
        <a
          href="/visualize"
          className="block w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-medium text-center hover:from-purple-700 hover:to-indigo-700 transition-all"
        >
          🔒 שדרג למנוי Vision - נסה חינם
        </a>
      )}
    </div>
  );
}
