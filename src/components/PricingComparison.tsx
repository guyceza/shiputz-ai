"use client";

import Link from "next/link";

const allFeatures = [
  { name: "הדמיה אחת בחינם", free: true, premium: true, plus: true },
  { name: "טיפים ומאמרים", free: true, premium: true, plus: true },
  { name: "מעקב תקציב", free: false, premium: true, plus: true },
  { name: "סריקת קבלות", free: false, premium: true, plus: true },
  { name: "ניתוח הצעות מחיר", free: false, premium: true, plus: true },
  { name: "בדיקת חוזים", free: false, premium: true, plus: true },
  { name: "התראות חכמות", free: false, premium: true, plus: true },
  { name: "עוזר אישי", free: false, premium: true, plus: true },
  { name: "הדמיות נוספות", free: false, premium: false, plus: true },
  { name: "Shop the Look", free: false, premium: false, plus: true, link: "/shop-look" },
];

export default function PricingComparison() {
  return (
    <div className="flex flex-col lg:flex-row-reverse gap-6 justify-center items-stretch max-w-6xl mx-auto">
      
      {/* Free Card - LEFTMOST */}
      <div className="flex-1 border border-gray-200 rounded-2xl p-8 bg-white flex flex-col">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">חינם</h3>
          <p className="text-gray-500 text-sm">לטעימה ראשונה</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">₪0</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">ללא התחייבות</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {allFeatures.map((feature: any, i) => (
            <li key={i} className={`flex items-center gap-3 ${feature.free ? 'text-gray-900' : 'text-gray-300'}`}>
              {feature.free ? (
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
          href="/signup"
          className="block w-full border-2 border-gray-300 text-gray-600 py-3 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors mt-auto"
        >
          התחל בחינם
        </Link>
      </div>

      {/* Premium Card */}
      <div className="flex-1 border border-gray-200 rounded-2xl p-8 bg-white flex flex-col">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
          <p className="text-gray-500 text-sm">לניהול תקציב מלא</p>
        </div>
        
        <div className="mb-6">
          <div className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
            50% הנחה
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg text-gray-400 line-through">₪599</span>
            <span className="text-4xl font-bold text-gray-900">₪299.99</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">תשלום חד פעמי</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {allFeatures.map((feature: any, i) => (
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
          className="block w-full border-2 border-gray-900 text-gray-900 py-3 rounded-lg text-center font-medium hover:bg-gray-50 transition-colors mt-auto"
        >
          בחר Premium
        </Link>
      </div>

      {/* Premium Plus Card - CENTER - Highlighted */}
      <div className="flex-1 border-2 border-gray-900 rounded-2xl p-8 bg-white relative flex flex-col">
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
            <span className="text-lg text-gray-400 line-through">₪699</span>
            <span className="text-4xl font-bold text-gray-900">₪349.99</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">תשלום חד פעמי</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {allFeatures.map((feature: any, i) => (
            <li key={i} className="flex items-center gap-3 text-gray-900">
              <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature.link ? (
                <Link href={feature.link} className={`underline underline-offset-2 decoration-gray-400 hover:decoration-gray-900 transition-colors ${feature.plus && !feature.premium ? 'font-medium' : ''}`}>
                  {feature.name}
                </Link>
              ) : (
                <span className={feature.plus && !feature.premium ? 'font-medium' : ''}>{feature.name}</span>
              )}
            </li>
          ))}
        </ul>
        
        <Link
          href="/checkout?plan=plus"
          className="block w-full bg-gray-900 text-white py-3 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors mt-auto"
        >
          בחר Premium Plus
        </Link>
      </div>

      {/* Business Card - RIGHT */}
      <div className="flex-1 border border-gray-200 rounded-2xl p-8 bg-gradient-to-b from-gray-50 to-white flex flex-col">
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
        
        <ul className="space-y-3 mb-8 text-gray-700 flex-grow">
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>כל הפיצ׳רים של Plus</span>
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
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>דוחות מתקדמים</span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>API לאינטגרציה</span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>מיתוג אישי</span>
          </li>
          <li className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>הדרכה אישית</span>
          </li>
        </ul>
        
        <Link
          href="/contact"
          className="block w-full border-2 border-gray-900 text-gray-900 py-3 rounded-lg text-center font-medium hover:bg-gray-100 transition-colors mt-auto"
        >
          דברו איתנו
        </Link>
      </div>
      
    </div>
  );
}
