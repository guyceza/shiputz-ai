"use client";

import Link from "next/link";

interface PricingCardProps {
  variant?: "full" | "compact" | "mini";
  className?: string;
}

const features = [
  "4 הדמיות שיפוץ AI",
  "אפשרות לרכישת חבילות נוספות",
  "הערכות עלויות מפורטות",
  "כתב כמויות אוטומטי",
  "ניתוח הצעות מחיר מקבלנים",
  "סריקת קבלות + מעקב תקציב",
  "Shop the Look — קנייה בקליק",
  "צ׳אט תמיכה AI",
];

const originalPrice = 99;
const purimPrice = 69;

export default function PricingCard({ 
  variant = "full", 
  className = ""
}: PricingCardProps) {
  
  // Mini variant
  if (variant === "mini") {
    return (
      <div className={`relative bg-white border border-gray-200 rounded-2xl px-8 py-6 shadow-sm w-full max-w-lg ${className}`}>
        <div className="flex items-center justify-between">
          <Link
            href="/pricing"
            className="text-white px-8 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#101010' }}
          >
            לרכוש
          </Link>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-lg text-gray-400 line-through">₪{originalPrice}</span>
              <span className="text-4xl font-bold text-gray-900">₪{purimPrice}</span>
            </div>
            <span className="text-sm text-gray-500">תשלום חד-פעמי · לא מנוי</span>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-xs ${className}`}>
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-sm font-medium mb-3">
            Pro
          </div>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-lg text-gray-400 line-through">₪{originalPrice}</span>
            <span className="text-4xl font-bold text-gray-900">₪{purimPrice}</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">תשלום חד-פעמי</p>
        </div>
        
        <ul className="text-right space-y-2 mb-5 text-sm">
          {features.slice(0, 5).map((feature, i) => (
            <li key={i} className="flex items-center gap-2 text-gray-700">
              <span className="text-xs text-gray-900">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Link
          href="/pricing"
          className="block w-full text-white py-3 rounded-lg text-center text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#101010' }}
        >
          🎭 לרכוש — ₪{purimPrice}
        </Link>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`border-2 border-gray-900 rounded-2xl p-8 bg-white shadow-sm max-w-sm mx-auto relative ${className}`} dir="rtl">
      <div className="absolute -top-3 right-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
        🎭 מבצע פורים
      </div>
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
        <p className="text-gray-500 text-sm">4 הדמיות + כל הכלים</p>
      </div>
      
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg text-gray-400 line-through">₪{originalPrice}</span>
          <span className="text-4xl font-bold text-gray-900">₪{purimPrice}</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">תשלום חד-פעמי</p>
        <div className="mt-2">
          <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            🎭 30% הנחה לפורים
          </span>
        </div>
      </div>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-900">
            <span className="flex-shrink-0 text-sm">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link
        href="/pricing"
        className="block bg-gray-900 text-white py-4 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors"
      >
        🎭 לרכוש — ₪{purimPrice}
      </Link>
    </div>
  );
}
