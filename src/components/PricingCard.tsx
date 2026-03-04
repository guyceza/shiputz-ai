"use client";

import { useState } from "react";
import Link from "next/link";

interface PricingCardProps {
  variant?: "full" | "compact" | "mini";
  className?: string;
}

const features = [
  "הדמיות שיפוץ AI ללא הגבלה",
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

  // Full variant
  return (
    <div className={`border border-gray-200 rounded-2xl p-8 bg-white shadow-sm max-w-sm mx-auto ${className}`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium mb-4">
          Pro
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-1 bg-gray-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setIsAnnual(false)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              !isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            חודשי
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              isAnnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            שנתי
            <span className="text-green-600 text-xs mr-1">חסכון 35%</span>
          </button>
        </div>
        
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold text-gray-900">₪{isAnnual ? annualMonthly : monthlyPrice}</span>
          <span className="text-gray-500 text-lg">/חודש</span>
        </div>
        {isAnnual && (
          <p className="text-gray-400 text-sm mt-1">₪{annualTotal} לשנה</p>
        )}
        <p className="text-gray-500 mt-2 text-sm">ביטול בכל רגע</p>
      </div>
      
      <ul className="text-right space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-gray-900">
            <span className="text-sm text-gray-900">✓</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      
      <Link
        href="/checkout"
        className="block bg-gray-900 text-white py-4 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors"
      >
        להתחיל — ₪{isAnnual ? annualMonthly : monthlyPrice}/חודש
      </Link>
    </div>
  );
}
