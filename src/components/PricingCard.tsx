"use client";

import { useState } from "react";
import Link from "next/link";

interface PricingCardProps {
  variant?: "full" | "compact" | "mini";
  className?: string;
}

export default function PricingCard({ 
  variant = "full", 
  className = ""
}: PricingCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'plus'>('plus');
  
  // Mini variant - compact but clear pricing card with plan toggle
  if (variant === "mini") {
    return (
      <div className={`relative bg-white border-2 border-emerald-500 rounded-2xl px-6 py-5 shadow-lg hover-scale hover-glow ${className}`}>
        {/* Badge */}
        <div className="absolute -top-3 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          50% הנחה
        </div>
        
        {/* Plan Toggle */}
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setSelectedPlan('premium')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedPlan === 'premium'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Premium
          </button>
          <button
            onClick={() => setSelectedPlan('plus')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedPlan === 'plus'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⭐ Premium Plus
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-sm text-gray-400 line-through">
                {selectedPlan === 'plus' ? '₪229' : '₪299'}
              </span>
              <div className="text-3xl font-bold text-gray-900">
                {selectedPlan === 'plus' ? '₪179' : '₪149'}
              </div>
            </div>
            <span className="text-sm text-emerald-600 font-medium">
              {selectedPlan === 'plus' ? '💳 חד פעמי · כולל 2 הדמיות AI' : '💳 תשלום חד פעמי · בלי מנוי'}
            </span>
          </div>
          <Link
            href={selectedPlan === 'plus' ? '/checkout?plan=plus' : '/checkout'}
            className="bg-emerald-600 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-emerald-700 whitespace-nowrap shadow-md hover:shadow-lg hover-bounce hover-shine"
          >
            לרכישה ←
          </Link>
        </div>
      </div>
    );
  }

  // Compact variant - medium size, key info only
  if (variant === "compact") {
    return (
      <div className={`bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-lg max-w-xs hover-lift hover-glow ${className}`}>
        {/* Badge */}
        <div className="flex justify-between items-start mb-4">
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            50% הנחה
          </span>
        </div>
        
        {/* Plan Toggle */}
        <div className="flex gap-2 mb-4 justify-center">
          <button
            onClick={() => setSelectedPlan('premium')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedPlan === 'premium'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Premium
          </button>
          <button
            onClick={() => setSelectedPlan('plus')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedPlan === 'plus'
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⭐ Plus
          </button>
        </div>
        
        {/* Price */}
        <div className="text-center mb-4">
          <span className="text-lg text-gray-400 line-through">
            {selectedPlan === 'plus' ? '₪229' : '₪299'}
          </span>
          <div className="text-4xl font-bold text-gray-900">
            {selectedPlan === 'plus' ? '₪179' : '₪149'}
          </div>
          <p className="text-sm text-green-600 font-medium">💳 תשלום חד פעמי</p>
        </div>
        
        {/* Key features */}
        <ul className="text-right space-y-2 mb-6 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span>
            <span>מעקב תקציב + קבלות AI</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span>
            <span>ניתוח הצעות מחיר</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-emerald-500">✓</span>
            <span>עוזר AI אישי</span>
          </li>
          {selectedPlan === 'plus' && (
            <li className="flex items-center gap-2">
              <span className="text-purple-500">✓</span>
              <span className="text-purple-700 font-medium">2 הדמיות AI מתנה!</span>
            </li>
          )}
        </ul>
        
        <Link
          href={selectedPlan === 'plus' ? '/checkout?plan=plus' : '/checkout'}
          className="block w-full bg-gray-900 text-white py-3 rounded-full text-center text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          לרכישה
        </Link>
      </div>
    );
  }

  // Full variant - original design with plan toggle
  return (
    <div className={`border-2 border-gray-400 rounded-3xl p-10 relative overflow-hidden bg-white shadow-lg max-w-sm mx-auto hover-scale hover-glow ${className}`}>
      {/* Discount Badge */}
      <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        50% הנחה
      </div>
      
      {/* Plan Toggle */}
      <div className="flex gap-2 mb-6 justify-center">
        <button
          onClick={() => setSelectedPlan('premium')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedPlan === 'premium'
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Premium
        </button>
        <button
          onClick={() => setSelectedPlan('plus')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedPlan === 'plus'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          ⭐ Premium Plus
        </button>
      </div>
      
      <div className="mb-2 text-center">
        <span className="text-2xl text-gray-400 line-through">
          {selectedPlan === 'plus' ? '₪229' : '₪299'}
        </span>
      </div>
      <div className="text-6xl font-semibold text-gray-900 mb-2 text-center">
        {selectedPlan === 'plus' ? '₪179' : '₪149'}
      </div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">💳 תשלום חד פעמי</span>
      </div>
      <p className="text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-8 text-center">מבצע לזמן מוגבל · בלי מנוי</p>
      
      <ul className="text-right space-y-4 mb-10 text-sm text-gray-600">
        <li className="flex items-center gap-3">
          <span className="text-green-500">✓</span>
          <span>מעקב תקציב ללא הגבלה</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-green-500">✓</span>
          <span>סריקת קבלות AI</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-green-500">✓</span>
          <span>ניתוח הצעות מחיר</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-green-500">✓</span>
          <span>בדיקת חוזים</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-green-500">✓</span>
          <span>התראות חכמות</span>
        </li>
        <li className="flex items-center gap-3">
          <span className="text-green-500">✓</span>
          <span>עוזר AI אישי</span>
        </li>
        {selectedPlan === 'plus' && (
          <li className="flex items-center gap-3 bg-purple-50 -mx-2 px-2 py-2 rounded-lg">
            <span className="text-purple-500">✓</span>
            <span className="text-purple-700 font-medium">2 הדמיות AI מתנה!</span>
          </li>
        )}
      </ul>
      <Link
        href={selectedPlan === 'plus' ? '/checkout?plan=plus' : '/checkout'}
        className="block bg-gray-900 text-white py-4 rounded-full text-base hover:bg-gray-800 transition-colors text-center"
      >
        לרכישה
      </Link>
    </div>
  );
}
