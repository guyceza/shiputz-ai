"use client";

import Link from "next/link";

const allFeatures = [
  { name: "הדמיה אחת בחינם", free: true, premium: true, plus: true },
  { name: "טיפים ומאמרים", free: true, premium: true, plus: true },
  { name: "הזנת הוצאות ידנית", free: true, premium: true, plus: true },
  { name: "מעקב תקציב", free: false, premium: true, plus: true },
  { name: "סריקת קבלות", free: false, premium: true, plus: true },
  { name: "ניתוח הצעות מחיר", free: false, premium: true, plus: true },
  { name: "בדיקת חוזים", free: false, premium: true, plus: true },
  { name: "התראות חכמות", free: false, premium: true, plus: true },
  { name: "עוזר אישי", free: false, premium: true, plus: true },
  { name: "4 הדמיות במערכת AI Vision", free: false, premium: false, plus: true },
  { name: "Shop the Look", free: false, premium: false, plus: true, link: "/shop-look" },
];

const businessFeatures = [
  "כל הפיצ׳רים של Plus",
  "הדמיות ללא הגבלה",
  "ניהול מספר פרויקטים",
  "גישה ללקוחות שלך",
  "תמיכה עדיפות",
  "דוחות מתקדמים",
  "API לאינטגרציה",
  "מיתוג אישי",
  "הדרכה אישית",
  "SLA מותאם",
];

export default function PricingComparison() {
  return (
    <div dir="ltr" className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full px-4 lg:px-8 justify-center">
      
      {/* Free Card - LEFTMOST */}
      <div className="border border-gray-200 rounded-2xl p-6 lg:p-10 bg-white flex flex-col flex-1 max-w-[320px]" dir="rtl">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">חינם</h3>
          <p className="text-gray-500 text-sm">לטעימה ראשונה</p>
        </div>
        
        <div className="mb-6">
          <div className="h-6 mb-2"></div>
          <div className="flex flex-col">
            <span className="text-sm text-transparent">.</span>
            <span className="text-3xl font-bold text-gray-900">₪0</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">ללא התחייבות</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {allFeatures.filter((f: any) => !f.plusOnly).map((feature: any, i) => (
            <li key={i} className={`flex items-start gap-0 ${feature.free ? 'text-gray-900' : 'text-gray-300'}`}>
              <span className="flex-shrink-0 ml-0.5">{feature.free ? '✓' : '✗'}</span>
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
      <div className="border border-gray-200 rounded-2xl p-6 lg:p-10 bg-white flex flex-col flex-1 max-w-[320px]" dir="rtl">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Premium</h3>
          <p className="text-gray-500 text-sm">לניהול תקציב מלא</p>
        </div>
        
        <div className="mb-6">
          <div className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full mb-2">
            50% הנחה
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 line-through">₪599</span>
            <span className="text-3xl font-bold text-gray-900">₪299.99</span>
          </div>
          <p className="text-emerald-600 text-sm mt-1 font-semibold animate-pulse">💰 תשלום חד פעמי</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {allFeatures.filter((f: any) => !f.plusOnly).map((feature: any, i) => (
            <li key={i} className={`flex items-start gap-0 ${feature.premium ? 'text-gray-900' : 'text-gray-300'}`}>
              <span className="flex-shrink-0 ml-0.5">{feature.premium ? '✓' : '✗'}</span>
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

      {/* Premium Plus Card - Highlighted */}
      <div className="border-2 border-gray-900 rounded-2xl p-6 lg:p-10 bg-white relative flex flex-col flex-1 max-w-[320px]" dir="rtl">
        {/* Popular Badge */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-xs font-bold px-4 py-1 rounded-full" style={{ backgroundColor: '#101010' }}>
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
          <div className="flex flex-col">
            <span className="text-sm text-gray-400 line-through">₪699</span>
            <span className="text-3xl font-bold text-gray-900">₪349.99</span>
          </div>
          <p className="text-emerald-600 text-sm mt-1 font-semibold animate-pulse">💰 תשלום חד פעמי</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {allFeatures.map((feature: any, i) => (
            <li key={i} className="flex items-start gap-0 text-gray-900">
              <span className="flex-shrink-0 ml-0.5">✓</span>
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
          className="block w-full text-white py-3 rounded-lg text-center font-medium hover:opacity-90 transition-colors mt-auto" style={{ backgroundColor: '#101010' }}
        >
          בחר Premium Plus
        </Link>
      </div>

      {/* Business Card - RIGHTMOST */}
      <div className="border border-gray-200 rounded-2xl p-6 lg:p-10 bg-gradient-to-b from-gray-50 to-white flex flex-col flex-1 max-w-[320px]" dir="rtl">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">לעסקים</h3>
          <p className="text-gray-500 text-sm">למעצבי פנים וקבלנים</p>
        </div>
        
        <div className="mb-6">
          <div className="h-6 mb-2"></div>
          <div className="flex flex-col">
            <span className="text-sm text-transparent">.</span>
            <span className="text-3xl font-bold text-gray-900">בהתאמה</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">מותאם לצרכים שלך</p>
        </div>
        
        <ul className="space-y-3 mb-8 text-gray-700 flex-grow">
          {businessFeatures.map((feature, i) => (
            <li key={i} className="flex items-start gap-0">
              <span className="flex-shrink-0 text-gray-900">✓</span>
              <span>{feature}</span>
            </li>
          ))}
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
