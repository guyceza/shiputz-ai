"use client";

import Link from "next/link";

const freeFeatures = [
  { name: "הדמיה אחת בחינם", included: true },
  { name: "טיפים ומאמרים", included: true },
  { name: "הזנת הוצאות ידנית", included: true },
  { name: "הדמיות ללא הגבלה", included: false },
  { name: "הערכות עלויות מפורטות", included: false },
  { name: "כתב כמויות אוטומטי", included: false },
  { name: "ניתוח הצעות מחיר", included: false },
  { name: "סריקת קבלות + מעקב תקציב", included: false },
  { name: "Shop the Look", included: false },
  { name: "צ׳אט תמיכה AI", included: false },
];

const proFeatures = [
  { name: "הדמיות שיפוץ AI ללא הגבלה", included: true },
  { name: "הערכות עלויות מפורטות", included: true },
  { name: "כתב כמויות אוטומטי", included: true },
  { name: "ניתוח הצעות מחיר מקבלנים", included: true },
  { name: "סריקת קבלות + מעקב תקציב", included: true },
  { name: "Shop the Look — קנייה בקליק", included: true },
  { name: "צ׳אט תמיכה AI", included: true },
  { name: "התראות חכמות", included: true },
  { name: "מעקב תקציב מלא", included: true },
  { name: "ביטול בכל רגע", included: true },
];

export default function PricingComparison() {
  return (
    <div dir="ltr" className="flex flex-col md:flex-row gap-4 md:gap-6 w-full px-4 md:px-8 justify-center">
      
      {/* Free Card */}
      <div className="border border-gray-200 rounded-2xl p-6 md:p-10 bg-white flex flex-col flex-1 max-w-[360px]" dir="rtl">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">חינם</h3>
          <p className="text-gray-500 text-sm">לטעימה ראשונה</p>
        </div>
        
        <div className="mb-6">
          <span className="text-3xl font-bold text-gray-900">₪0</span>
          <p className="text-gray-500 text-sm mt-1">ללא התחייבות</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {freeFeatures.map((feature, i) => (
            <li key={i} className={`flex items-start gap-0 ${feature.included ? 'text-gray-900' : 'text-gray-300'}`}>
              <span className="flex-shrink-0 ml-0.5">{feature.included ? '✓' : '✗'}</span>
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

      {/* Pro Card - RECOMMENDED */}
      <div className="border-2 border-gray-900 rounded-2xl p-6 md:p-10 bg-white flex flex-col flex-1 max-w-[360px] relative" dir="rtl">
        <div className="absolute -top-3 right-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
          מומלץ
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
          <p className="text-gray-500 text-sm">הכל ללא הגבלה</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">₪29</span>
            <span className="text-gray-500">/חודש</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">או ₪19/חודש בתוכנית שנתית</p>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {proFeatures.map((feature, i) => (
            <li key={i} className="flex items-start gap-0 text-gray-900">
              <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
              <span>{feature.name}</span>
            </li>
          ))}
        </ul>
        
        <Link
          href="/checkout"
          className="block w-full bg-gray-900 text-white py-3 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors mt-auto"
        >
          להתחיל — ₪29/חודש
        </Link>
      </div>

    </div>
  );
}
