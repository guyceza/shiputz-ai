"use client";

import Link from "next/link";

const allFeatures = [
  { name: "מעקב תקציב ללא הגבלה", premium: true, plus: true },
  { name: "סריקת קבלות", premium: true, plus: true },
  { name: "ניתוח הצעות מחיר", premium: true, plus: true },
  { name: "בדיקת חוזים", premium: true, plus: true },
  { name: "התראות חכמות", premium: true, plus: true },
  { name: "עוזר אישי", premium: true, plus: true },
  { name: "הדמיית חדר", premium: false, plus: true },
  { name: "2 הדמיות כלולות", premium: false, plus: true },
];

export default function PricingComparison() {
  return (
    <div className="flex flex-col lg:flex-row-reverse gap-6 justify-center items-stretch max-w-5xl mx-auto">
      
      {/* Premium Card - RIGHT in RTL = LEFT visually */}
      <div className="flex-1 border border-gray-200 rounded-2xl p-8 bg-white">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
          <p className="text-gray-500 text-sm">לניהול תקציב בסיסי</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">₪149</span>
            <span className="text-lg text-gray-400 line-through">₪299</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">תשלום חד פעמי</p>
        </div>
        
        <ul className="space-y-3 mb-8">
          {allFeatures.map((feature, i) => (
            <li key={i} className={`flex items-center gap-3 ${feature.premium ? 'text-gray-900' : 'text-gray-300'}`}>
              {feature.premium ? (
                <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{feature.name}</span>
            </li>
          ))}
        </ul>
        
        <Link
          href="/checkout"
          className="block w-full border-2 border-gray-900 text-gray-900 py-3 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors"
        >
          בחר Premium
        </Link>
      </div>

      {/* Premium Plus Card - CENTER - Highlighted */}
      <div className="flex-1 border-2 border-gray-900 rounded-2xl p-8 bg-white relative">
        {/* Popular Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
          הכי פופולרי
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Premium Plus</h3>
          <p className="text-gray-500 text-sm">כולל הדמיות חדר</p>
        </div>
        
        <div className="mb-6">
          <div className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
            50% הנחה
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">₪179</span>
            <span className="text-lg text-gray-400 line-through">₪359</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">תשלום חד פעמי</p>
        </div>
        
        <ul className="space-y-3 mb-8">
          {allFeatures.map((feature, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-900">
              <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className={feature.plus && !feature.premium ? 'font-medium' : ''}>{feature.name}</span>
            </li>
          ))}
        </ul>
        
        <Link
          href="/checkout?plan=plus"
          className="block w-full bg-gray-900 text-white py-3 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors"
        >
          בחר Premium Plus
        </Link>
      </div>

      {/* Business Card - RIGHT */}
      <div className="flex-1 border border-gray-200 rounded-2xl p-8 bg-gradient-to-b from-gray-50 to-white">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">לעסקים</h3>
          <p className="text-gray-500 text-sm">למעצבי פנים וקבלנים</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">בהתאמה</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">מותאם לצרכים שלך</p>
        </div>
        
        <ul className="space-y-3 mb-8 text-gray-700">
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>כל הפיצ'רים של Plus</span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>הדמיות ללא הגבלה</span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>ניהול מספר פרויקטים</span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>גישה ללקוחות שלך</span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>תמיכה עדיפות</span>
          </li>
        </ul>
        
        <Link
          href="/contact"
          className="block w-full border-2 border-gray-900 text-gray-900 py-3 rounded-lg text-center font-medium hover:bg-gray-100 transition-colors"
        >
          דברו איתנו
        </Link>
      </div>
      
    </div>
  );
}
