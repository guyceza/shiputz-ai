"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// Animated number component - counts up/down smoothly
function AnimatedPrice({ value, duration = 600 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number | null>(null);
  const startRef = useRef<number>(value);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const from = displayValue;
    startRef.current = from;
    startTimeRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.round(from + (value - from) * eased);
      setDisplayValue(current);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <>{displayValue}</>;
}

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
  "הדמיות שיפוץ AI ללא הגבלה",
  "הערכות עלויות מפורטות",
  "כתב כמויות אוטומטי",
  "ניתוח הצעות מחיר מקבלנים",
  "סריקת קבלות + מעקב תקציב",
  "Shop the Look — קנייה בקליק",
  "צ׳אט תמיכה AI",
  "התראות חכמות",
  "מעקב תקציב מלא",
  "ביטול בכל רגע",
];

export default function PricingComparison() {
  const [isAnnual, setIsAnnual] = useState(false);

  const monthlyPrice = 29;
  const annualMonthly = 19;
  const annualTotal = 228;

  const currentPrice = isAnnual ? annualMonthly : monthlyPrice;

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

      {/* Pro Card */}
      <div className="border-2 border-gray-900 rounded-2xl p-6 md:p-10 bg-white flex flex-col flex-1 max-w-[360px] relative" dir="rtl">
        <div className="absolute -top-3 right-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
          מומלץ
        </div>
        
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
          <p className="text-gray-500 text-sm">הכל ללא הגבלה</p>
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
        
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 tabular-nums">
              ₪<AnimatedPrice value={currentPrice} />
            </span>
            <span className="text-gray-500">/חודש</span>
          </div>
          <div className="h-5 mt-1">
            {isAnnual ? (
              <p className="text-green-600 text-sm font-medium animate-fade-in">
                ₪{annualTotal} לשנה — חוסך ₪{monthlyPrice * 12 - annualTotal} בשנה
              </p>
            ) : (
              <p className="text-gray-400 text-sm">ביטול בכל רגע</p>
            )}
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
          href="/checkout"
          className="block w-full bg-gray-900 text-white py-3 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors mt-auto"
        >
          להתחיל — ₪{isAnnual ? annualMonthly : monthlyPrice}/חודש
        </Link>
      </div>

    </div>
  );
}
