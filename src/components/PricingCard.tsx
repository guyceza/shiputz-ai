"use client";

import Link from "next/link";

interface PricingCardProps {
  variant?: "full" | "compact" | "mini";
  isLoggedIn?: boolean;
  className?: string;
}

export default function PricingCard({ 
  variant = "full", 
  isLoggedIn = false,
  className = ""
}: PricingCardProps) {
  
  // Mini variant - compact but clear pricing card
  if (variant === "mini") {
    return (
      <div className={`relative bg-white border-2 border-emerald-500 rounded-2xl px-6 py-5 shadow-lg ${className}`}>
        {/* Badge */}
        <div className="absolute -top-3 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          50% הנחה
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="flex items-baseline gap-2 justify-end">
              <span className="text-sm text-gray-400 line-through">₪299.99</span>
              <div className="text-3xl font-bold text-gray-900">₪149.99</div>
            </div>
            <span className="text-sm text-emerald-600 font-medium">תשלום חד פעמי לכל הפרויקט</span>
          </div>
          <Link
            href={isLoggedIn ? "/dashboard" : "/checkout"}
            className="bg-emerald-600 text-white px-8 py-3 rounded-full text-base font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shadow-md hover:shadow-lg"
          >
            התחילו עכשיו ←
          </Link>
        </div>
      </div>
    );
  }

  // Compact variant - medium size, key info only
  if (variant === "compact") {
    return (
      <div className={`bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-lg max-w-xs ${className}`}>
        {/* Badge */}
        <div className="flex justify-between items-start mb-4">
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            50% הנחה
          </span>
        </div>
        
        {/* Price */}
        <div className="text-center mb-4">
          <span className="text-lg text-gray-400 line-through">₪299.99</span>
          <div className="text-4xl font-bold text-gray-900">₪149.99</div>
          <p className="text-sm text-gray-500">תשלום חד פעמי</p>
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
        </ul>
        
        <Link
          href={isLoggedIn ? "/dashboard" : "/checkout"}
          className="block w-full bg-gray-900 text-white py-3 rounded-full text-center text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          {isLoggedIn ? "לאזור האישי" : "התחילו עכשיו"}
        </Link>
      </div>
    );
  }

  // Full variant - original design
  return (
    <div className={`border-2 border-gray-400 rounded-3xl p-10 relative overflow-hidden bg-white shadow-lg max-w-sm mx-auto ${className}`}>
      {/* Discount Badge */}
      <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
        50% הנחה
      </div>
      
      <div className="mb-2 text-center">
        <span className="text-2xl text-gray-400 line-through">₪299.99</span>
      </div>
      <div className="text-6xl font-semibold text-gray-900 mb-2 text-center">₪149.99</div>
      <p className="text-gray-500 mb-2 text-center">תשלום חד פעמי</p>
      <p className="text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-8 text-center">מבצע לזמן מוגבל</p>
      
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
      </ul>
      <Link
        href={isLoggedIn ? "/dashboard" : "/checkout"}
        className="block bg-gray-900 text-white py-4 rounded-full text-base hover:bg-gray-800 transition-colors text-center"
      >
        {isLoggedIn ? "לאזור האישי" : "התחילו עכשיו"}
      </Link>
    </div>
  );
}
