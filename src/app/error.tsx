'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6">😕</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">משהו השתבש</h2>
        <p className="text-gray-500 mb-6">
          {error.message || 'אירעה שגיאה בלתי צפויה. אנחנו עובדים על זה!'}
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-4 font-mono">
            קוד שגיאה: {error.digest}
          </p>
        )}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition font-medium"
          >
            נסה שוב
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-full hover:bg-gray-200 transition font-medium"
          >
            חזרה לדשבורד
          </button>
        </div>
      </div>
    </div>
  );
}
