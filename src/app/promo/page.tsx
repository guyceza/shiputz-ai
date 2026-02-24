"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Special promo page - redirects to Vision checkout
export default function PromoPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Try to get email from localStorage and check main subscription
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.email) setEmail(user.email);
      setHasPurchased(user.purchased === true);
    } catch {
      setHasPurchased(false);
    }
    setCheckingAuth(false);
  }, []);

  const handleCheckout = () => {
    setLoading(true);
    // Redirect to Vision checkout
    window.location.href = '/checkout-vision';
  };

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-gray-500">טוען...</div>
      </div>
    );
  }

  // If user doesn't have main subscription, show message to buy main first
  if (!hasPurchased) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <nav className="h-11 bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
            <Link href="/" className="text-base font-semibold text-gray-900">
              ShiputzAI
            </Link>
          </div>
        </nav>
        
        <div className="max-w-md mx-auto px-6 py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">צריך קודם ShiputzAI</h1>
          <p className="text-gray-500 mb-8">
            כדי להשתמש בהדמיות AI, צריך קודם לרכוש את ShiputzAI הבסיסי
          </p>
          <Link
            href="/checkout"
            className="inline-block bg-gray-900 text-white px-8 py-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
          >
            לרכישת ShiputzAI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50" dir="rtl">
      <nav className="h-11 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-6 py-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            ✨ הדמיות AI
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ראה איך השיפוץ יראה
          </h1>
          <p className="text-gray-500">
            לפני שמתחילים - תראה בדיוק את התוצאה
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-gray-900 mb-2">₪39.99</div>
            <p className="text-gray-500 text-sm">לחודש · ביטול בכל עת</p>
          </div>

          <ul className="space-y-3 mb-8 text-sm text-gray-600">
            <li className="flex items-center gap-3">
              <span className="text-purple-500">✓</span>
              <span>10 הדמיות בחודש</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-purple-500">✓</span>
              <span>הערכת עלויות מדויקת</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-purple-500">✓</span>
              <span>Shop the Look - קנה את הסגנון</span>
            </li>
          </ul>

          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-full font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
          >
            {loading ? "מעבד..." : "להרשמה"}
          </button>
        </div>

        <p className="text-center text-sm text-gray-400">
          תשלום מאובטח
        </p>
      </div>
    </div>
  );
}
