'use client';

import Link from 'next/link';

export default function PaymentFailedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          התשלום לא הושלם 😕
        </h1>
        
        <p className="text-gray-600 mb-6">
          משהו השתבש בתהליך התשלום. אל דאגה - לא חויבת.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-right">
          <p className="text-sm text-gray-600 font-medium mb-2">סיבות אפשריות:</p>
          <ul className="text-sm text-gray-500 space-y-1">
            <li>• פרטי כרטיס אשראי שגויים</li>
            <li>• אין מספיק יתרה בכרטיס</li>
            <li>• הכרטיס חסום לעסקאות אינטרנט</li>
            <li>• בעיה טכנית זמנית</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link 
            href="/checkout"
            className="inline-block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            נסה שוב
          </Link>
          
          <Link 
            href="/"
            className="inline-block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            חזרה לדף הבית
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          נתקלת בבעיה? צור קשר: help@shipazti.com
        </p>
      </div>
    </div>
  );
}
