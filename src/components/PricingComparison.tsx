"use client";

import Link from "next/link";

const freeFeatures = [
  { name: "הדמיה אחת בחינם", included: true },
  { name: "טיפים ומאמרים", included: true },
  { name: "הזנת הוצאות ידנית", included: true },
  { name: "4 הדמיות שיפוץ AI", included: false },
  { name: "הערכות עלויות מפורטות", included: false },
  { name: "כתב כמויות אוטומטי", included: false },
  { name: "ניתוח הצעות מחיר", included: false },
  { name: "סריקת קבלות + מעקב תקציב", included: false },
  { name: "Shop the Look", included: false },
  { name: "צ׳אט תמיכה AI", included: false },
];

const proFeatures = [
  "4 הדמיות שיפוץ AI",
  "אפשרות לרכישת חבילות נוספות",
  "הערכות עלויות מפורטות",
  "כתב כמויות אוטומטי",
  "ניתוח הצעות מחיר מקבלנים",
  "סריקת קבלות + מעקב תקציב",
  "Shop the Look — קנייה בקליק",
  "צ׳אט תמיכה AI",
  "מעקב תקציב מלא",
];

export default function PricingComparison() {
  const originalPrice = 99;
  const purimPrice = 69;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full px-4 lg:px-8 justify-center items-center lg:items-stretch">
      
      {/* Free Card */}
      <div className="border border-gray-200 rounded-2xl p-6 lg:p-10 bg-white flex flex-col w-full lg:flex-1 lg:max-w-[360px] order-2 lg:order-2" dir="rtl">
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

      {/* Pro Card */}
      <div className="border-2 border-gray-900 rounded-2xl p-6 lg:p-10 bg-white flex flex-col w-full lg:flex-1 lg:max-w-[360px] relative order-1 lg:order-1" dir="rtl">
        <div className="absolute -top-3 right-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
          🎭 מבצע פורים
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
          <p className="text-gray-500 text-sm">4 הדמיות + כל הכלים</p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg text-gray-400 line-through">₪{originalPrice}</span>
            <span className="text-3xl font-bold text-gray-900">₪{purimPrice}</span>
          </div>
          <p className="text-gray-500 text-sm mt-1">תשלום חד-פעמי</p>
          <div className="mt-2">
            <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
              🎭 30% הנחה לפורים
            </span>
          </div>
        </div>
        
        <ul className="space-y-3 mb-8 flex-grow">
          {proFeatures.map((feature, i) => (
            <li key={i} className="flex items-start gap-0 text-gray-900">
              <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Link
          href="/pricing"
          className="block w-full bg-gray-900 text-white py-3 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors mt-auto"
        >
          🎭 לרכוש — ₪{purimPrice}
        </Link>
      </div>

    </div>
  );
}
