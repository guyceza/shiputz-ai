"use client";

import { useState } from "react";
import Link from "next/link";

interface PricingCardProps {
  variant?: "full" | "compact" | "mini";
  className?: string;
}

const features = [
  { name: "מעקב תקציב ללא הגבלה", includedIn: ["premium", "plus"] },
  { name: "סריקת קבלות", includedIn: ["premium", "plus"] },
  { name: "ניתוח הצעות מחיר", includedIn: ["premium", "plus"] },
  { name: "בדיקת חוזים", includedIn: ["premium", "plus"] },
  { name: "התראות חכמות", includedIn: ["premium", "plus"] },
  { name: "עוזר אישי", includedIn: ["premium", "plus"] },
  { name: "הדמיית חדר", includedIn: ["plus"] },
  { name: "הדמיות כלולות", includedIn: ["plus"] },
  { name: "Shop the Look", includedIn: ["plus"], link: "/shop-look" },
];

export default function PricingCard({ 
  variant = "full", 
  className = ""
}: PricingCardProps) {
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'plus'>('plus');
  
  // Mini variant - wide, black & white only
  if (variant === "mini") {
    return (
      <div className={`relative bg-white border border-gray-200 rounded-2xl px-8 py-6 shadow-sm w-full max-w-lg ${className}`}>
        {/* Plan Toggle */}
        <div className="flex justify-center gap-2 mb-5">
          <button
            onClick={() => setSelectedPlan('premium')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedPlan === 'premium'
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Premium
          </button>
          <button
            onClick={() => setSelectedPlan('plus')}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selectedPlan === 'plus'
                ? 'bg-gray-900 text-white'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Premium Plus
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <Link
            href={selectedPlan === 'plus' ? '/checkout?plan=plus' : '/checkout'}
            className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            לרכישה
          </Link>
          <div className="text-right">
            <div className="flex items-baseline gap-3 justify-end">
              <span className="text-4xl font-bold text-gray-900">
                {selectedPlan === 'plus' ? '₪315.99' : '₪299.99'}
              </span>
              <span className="text-base text-gray-400 line-through">
                {selectedPlan === 'plus' ? '₪631' : '₪599'}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {selectedPlan === 'plus' ? 'חד פעמי · כולל הדמיות' : 'תשלום חד פעמי'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <div className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm max-w-xs ${className}`}>
        {/* Plan Toggle */}
        <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mb-5">
          <button
            onClick={() => setSelectedPlan('premium')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPlan === 'premium'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Premium
          </button>
          <button
            onClick={() => setSelectedPlan('plus')}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              selectedPlan === 'plus'
                ? 'bg-gray-900 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Plus
          </button>
        </div>
        
        {/* Price */}
        <div className="text-center mb-5">
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {selectedPlan === 'plus' ? '₪315.99' : '₪299.99'}
            </span>
            <span className="text-gray-400 line-through text-lg">
              {selectedPlan === 'plus' ? '₪631' : '₪599'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">תשלום חד פעמי</p>
        </div>
        
        {/* Features with included/not included */}
        <ul className="text-right space-y-2.5 mb-6 text-sm">
          {features.slice(0, 6).map((feature, i) => {
            const isIncluded = feature.includedIn.includes(selectedPlan);
            return (
              <li key={i} className={`flex items-center gap-2 ${isIncluded ? 'text-gray-900' : 'text-gray-300'}`}>
                <span className={`text-xs ${isIncluded ? 'text-gray-900' : 'text-gray-300'}`}>✦</span>
                <span>{feature.name}</span>
              </li>
            );
          })}
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
          onClick={() => setSelectedPlan('premium')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            selectedPlan === 'premium'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Premium
        </button>
        <button
          onClick={() => setSelectedPlan('plus')}
          className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all ${
            selectedPlan === 'plus'
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Premium Plus
        </button>
      </div>
      
      {/* Price */}
      <div className="text-center mb-6">
        <div className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-4 py-1.5 rounded-full mb-4">
          50% הנחה
        </div>
        <div className="flex items-baseline justify-center gap-3 flex-row-reverse">
          <span className="text-5xl font-bold text-gray-900">
            {selectedPlan === 'plus' ? '₪315.99' : '₪299.99'}
          </span>
          <span className="text-xl text-gray-400 line-through">
            {selectedPlan === 'plus' ? '₪631' : '₪599'}
          </span>
        </div>
        <p className="text-gray-500 mt-2">תשלום חד פעמי</p>
        <p className="text-amber-600 text-sm font-medium mt-1">
          חוסך {selectedPlan === 'plus' ? '₪315' : '₪299'}
        </p>
      </div>
      
      {/* Features with included/not included styling */}
      <ul className="text-right space-y-3 mb-8">
        {features.map((feature, i) => {
          const isIncluded = feature.includedIn.includes(selectedPlan);
          return (
            <li key={i} className={`flex items-center gap-3 ${isIncluded ? 'text-gray-900' : 'text-gray-300'}`}>
              <span className={`text-sm ${isIncluded ? 'text-gray-900' : 'text-gray-300'}`}>✦</span>
              <span>{feature.name}</span>
            </li>
          );
        })}
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
