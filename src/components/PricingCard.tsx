"use client";

import { useState } from "react";
import Link from "next/link";

interface PricingCardProps {
  variant?: "full" | "compact" | "mini";
  className?: string;
}

const features = [
  "5 הדמיות שיפוץ AI בחודש",
  "הערכות עלויות מפורטות",
  "כתב כמויות אוטומטי",
  "ניתוח הצעות מחיר מקבלנים",
  "סריקת קבלות + מעקב תקציב",
  "Shop the Look — קנייה בקליק",
  "צ׳אט תמיכה AI",
  "התראות חכמות",
];

export default function PricingCard({ 
  variant = "full", 
  className = ""
}: PricingCardProps) {
  const [isAnnual, setIsAnnual] = useState(false);

  const monthlyPrice = 29;
  const annualMonthly = 19;
  const annualTotal = 228;
  
  // Mini variant
  if (variant === "mini") {
    return (
      <div className={`relative bg-white border border-gray-200 rounded-2xl px-8 py-6 shadow-sm w-full max-w-lg ${className}`}>
        <div className="flex items-center justify-between">
          <Link
            href="/checkout"
            className="text-white px-8 py-3 rounded-lg text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#101010' }}
          >
            להתחיל
          </Link>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-4xl font-bold text-gray-900">₪{monthlyPrice}</span>
              <span className="text-base text-gray-500">/חודש</span>
            </div>
            <span className="text-sm text-gray-500">ביטול בכל רגע · הכל כלול</span>
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
            <span className="text-4xl font-bold text-gray-900">₪{isAnnual ? annualMonthly : monthlyPrice}</span>
            <span className="text-gray-500">/חודש</span>
          </div>
          <p className="text-sm text-gray-400 mt-1">ביטול בכל רגע</p>
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
          href="/checkout"
          className="block w-full text-white py-3 rounded-lg text-center text-sm font-medium hover:opacity-90 transition-colors" style={{ backgroundColor: '#101010' }}
        >
          להתחיל — ₪{monthlyPrice}/חודש
        </Link>
      </div>
    );
  }

  // Full variant — with Purim sale
  const purimMonthly = 19;
  const displayPrice = isAnnual ? annualMonthly : purimMonthly;
  const originalPrice = isAnnual ? monthlyPrice : monthlyPrice;

  return (
    <div className={`border-2 border-gray-900 rounded-2xl p-8 bg-white shadow-sm max-w-sm mx-auto relative ${className}`} dir="rtl">
      <div className="absolute -top-3 right-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
        🎭 מבצע פורים
      </div>
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
        <p className="text-gray-500 text-sm">5 הדמיות בחודש + חבילות</p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        <button
          onClick={() => setIsAnnual(false)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            !isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          חודשי
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          שנתי
          <span className="text-green-600 text-xs mr-1">-35%</span>
        </button>
      </div>
      
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <span className="text-lg text-gray-400 line-through">₪{originalPrice}</span>
          <span className="text-4xl font-bold text-gray-900">₪{displayPrice}</span>
          <span className="text-gray-500">{isAnnual ? '/חודש' : '/חודש ראשון'}</span>
        </div>
        <div className="mt-2">
          <span className="inline-block bg-green-50 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            🎭 33% הנחה לפורים
          </span>
        </div>
        <p className="text-gray-400 text-sm mt-1">
          {isAnnual 
            ? `₪${annualTotal} לשנה — חוסך ₪${monthlyPrice * 12 - annualTotal} בשנה`
            : 'חודש ראשון ₪19, אח״כ ₪29/חודש'
          }
        </p>
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
        href="/checkout"
        className="block bg-gray-900 text-white py-4 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors"
      >
        🎭 להתחיל — ₪{displayPrice}/חודש
      </Link>
    </div>
  );
}
