"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// Special promo page - 19.99₪ first month, then 40₪/month
const PROMO_CODE = "LAUNCH50";
const FIRST_MONTH_PRICE = "₪19.99";
const REGULAR_PRICE = "₪40";
const WHOP_MONTHLY_PLAN = "plan_ORVfC8pmG328G";

export default function PromoPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const copyPromoCode = async () => {
    await navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Create checkout session via API
      const res = await fetch('/api/whop/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: WHOP_MONTHLY_PLAN,
          email: email || undefined,
          redirectUrl: 'https://shipazti.com/dashboard',
        }),
      });
      const data = await res.json();
      if (data.purchase_url) {
        window.location.href = data.purchase_url;
      } else {
        // Fallback to direct URL
        window.location.href = `https://whop.com/checkout/${WHOP_MONTHLY_PLAN}${email ? `?email=${encodeURIComponent(email)}` : ''}`;
      }
    } catch {
      // Fallback to direct URL
      window.location.href = `https://whop.com/checkout/${WHOP_MONTHLY_PLAN}${email ? `?email=${encodeURIComponent(email)}` : ''}`;
    }
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
        
        <div className="max-w-md mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              המבצע דורש מנוי ShiputzAI
            </h1>
            <p className="text-gray-500 mb-8">
              כדי לנצל את המבצע, צריך קודם חשבון ShiputzAI פעיל
            </p>
            
            <Link
              href="/checkout"
              className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all mb-4"
            >
              הצטרף ל-ShiputzAI · ₪149.99
            </Link>
            
            <p className="text-xs text-gray-400">
              תשלום חד פעמי · אחרי זה תוכל לנצל את המבצע
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white" dir="rtl">
      {/* Navigation */}
      <nav className="h-11 bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        {/* Badge */}
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            🎁 מבצע מיוחד
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-4">
          חודש ראשון ב-{FIRST_MONTH_PRICE}
        </h1>
        <p className="text-lg text-gray-600 text-center mb-8">
          התחל לנהל את השיפוץ בצורה חכמה
        </p>

        {/* Price Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg mb-8">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="text-gray-400 line-through text-2xl">{REGULAR_PRICE}</span>
              <span className="text-5xl font-bold text-gray-900">{FIRST_MONTH_PRICE}</span>
            </div>
            <p className="text-gray-500 text-sm">לחודש הראשון · לאחר מכן {REGULAR_PRICE}/חודש</p>
          </div>

          <div className="border-t border-gray-100 pt-6 mb-6">
            <ul className="space-y-3">
              {[
                "מעקב תקציב בזמן אמת",
                "סריקת קבלות עם AI",
                "ניתוח הצעות מחיר",
                "עוזר AI אישי",
                "התראות לפני חריגות",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xs">✓</span>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="האימייל שלך"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              dir="ltr"
            />
          </div>

          {/* Promo Code Display */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-amber-800 text-sm text-center mb-2">
              💡 השתמש בקוד הזה בעמוד התשלום:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="bg-white px-4 py-2 rounded-lg text-lg font-bold text-amber-900 border border-amber-300">
                {PROMO_CODE}
              </code>
              <button
                onClick={copyPromoCode}
                className="px-3 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg text-amber-800 text-sm transition-colors"
              >
                {copied ? "✓ הועתק!" : "העתק"}
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            {loading ? "מעבד..." : `להמשיך לתשלום`}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            ביטול בכל עת · ללא התחייבות
          </p>
        </div>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 text-gray-400 text-sm">
          <span className="flex items-center gap-1.5">
            <span>🔒</span> תשלום מאובטח
          </span>
          <span className="flex items-center gap-1.5">
            <span>⚡</span> גישה מיידית
          </span>
        </div>
      </div>
    </div>
  );
}
