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
  
  // Mini variant - compact pricing card with plan toggle
  if (variant === "mini") {
    return (
      <div className={`relative bg-white border border-gray-200 rounded-2xl px-6 py-5 shadow-sm ${className}`}>
        {/* Plan Toggle */}
        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mb-4 w-fit mx-auto">
          <button
            onClick={() => setSelectedPlan('plus')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPlan === 'plus'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Premium Plus
          </button>
          <button
            onClick={() => setSelectedPlan('premium')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPlan === 'premium'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Premium
          </button>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-sm text-gray-400 line-through">
                {selectedPlan === 'plus' ? '₪359' : '₪299'}
              </span>
              <div className="text-3xl font-bold text-gray-900">
                {selectedPlan === 'plus' ? '₪179' : '₪149'}
              </div>
            </div>
            <span className="text-sm text-gray-500">
              {selectedPlan === 'plus' ? 'חד פעמי · כולל 2 הדמיות' : 'תשלום חד פעמי'}
            </span>
          </div>
          <Link
            href={selectedPlan === 'plus' ? '/checkout?plan=plus' : '/checkout'}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            לרכישה
          </Link>
        </div>
      </div>
    );
  }

  // Compact variant - medium size
  if (variant === "compact") {
    return (
      <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-xs ${className}`}>
        {/* Plan Toggle */}
        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mb-5">
          <button
            onClick={() => setSelectedPlan('plus')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPlan === 'plus'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Plus
          </button>
          <button
            onClick={() => setSelectedPlan('premium')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPlan === 'premium'
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Premium
          </button>
        </div>
        
        {/* Price */}
        <div className="text-center mb-5">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {selectedPlan === 'plus' ? '₪179' : '₪149'}
            </span>
            <span className="text-gray-400 line-through text-lg">
              {selectedPlan === 'plus' ? '₪359' : '₪299'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">תשלום חד פעמי</p>
        </div>
        
        {/* Features */}
        <ul className="text-right space-y-3 mb-6 text-sm text-gray-600">
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>מעקב תקציב + קבלות</span>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>ניתוח הצעות מחיר</span>
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>עוזר אישי</span>
          </li>
          {selectedPlan === 'plus' && (
            <li className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>2 הדמיות חדר</span>
            </li>
          )}
        </ul>
        
        <Link
          href={selectedPlan === 'plus' ? '/checkout?plan=plus' : '/checkout'}
          className="block w-full bg-gray-900 text-white py-3 rounded-lg text-center text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          לרכישה
        </Link>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`border border-gray-200 rounded-2xl p-8 bg-white shadow-sm max-w-sm mx-auto ${className}`}>
      {/* Plan Toggle */}
      <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mb-6">
        <button
          onClick={() => setSelectedPlan('plus')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            selectedPlan === 'plus'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Premium Plus
        </button>
        <button
          onClick={() => setSelectedPlan('premium')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            selectedPlan === 'premium'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Premium
        </button>
      </div>
      
      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-3">
          <span className="text-5xl font-bold text-gray-900">
            {selectedPlan === 'plus' ? '₪179' : '₪149'}
          </span>
          <span className="text-xl text-gray-400 line-through">
            {selectedPlan === 'plus' ? '₪359' : '₪299'}
          </span>
        </div>
        <p className="text-gray-500 mt-2">תשלום חד פעמי</p>
      </div>
      
      {/* Features */}
      <ul className="text-right space-y-4 mb-8 text-gray-600">
        <li className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>מעקב תקציב ללא הגבלה</span>
        </li>
        <li className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>סריקת קבלות</span>
        </li>
        <li className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>ניתוח הצעות מחיר</span>
        </li>
        <li className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>בדיקת חוזים</span>
        </li>
        <li className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>התראות חכמות</span>
        </li>
        <li className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>עוזר אישי</span>
        </li>
        {selectedPlan === 'plus' && (
          <li className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <svg className="w-5 h-5 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">2 הדמיות חדר</span>
          </li>
        )}
      </ul>
      
      <Link
        href={selectedPlan === 'plus' ? '/checkout?plan=plus' : '/checkout'}
        className="block bg-gray-900 text-white py-4 rounded-lg text-center font-medium hover:bg-gray-800 transition-colors"
      >
        לרכישה
      </Link>
    </div>
  );
}
