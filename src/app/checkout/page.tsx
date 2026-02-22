"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const ORIGINAL_PRICE = 299.99;
const SALE_PRICE = 149.99;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountValid, setDiscountValid] = useState<boolean | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);

  // Pre-fill from URL params
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setDiscountCode(code);
    }
    
    // Try to get email from localStorage
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.email) setEmail(user.email);
    } catch {}
  }, [searchParams]);

  const checkDiscountCode = async () => {
    if (!discountCode.trim() || !email.trim()) {
      setDiscountError("נא להזין אימייל וקוד הנחה");
      return;
    }

    setCheckingCode(true);
    setDiscountError("");
    setDiscountValid(null);

    try {
      const response = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: discountCode.toUpperCase(), 
          email: email.toLowerCase() 
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setDiscountValid(true);
        setDiscountPercent(data.discount);
      } else {
        setDiscountValid(false);
        setDiscountError(data.reason || "קוד לא תקף");
      }
    } catch (err) {
      setDiscountError("שגיאה בבדיקת הקוד");
    }

    setCheckingCode(false);
  };

  const finalPrice = discountValid 
    ? SALE_PRICE * (1 - discountPercent / 100) 
    : SALE_PRICE;

  const handlePurchase = async () => {
    if (!email.trim()) {
      alert("נא להזין אימייל");
      return;
    }

    setLoading(true);

    // Mark discount code as used if valid
    if (discountValid && discountCode) {
      await fetch("/api/discount", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.toUpperCase() }),
      });
    }

    // Build Whop checkout URL
    // Use discounted plan if discount code is valid
    const WHOP_PLAN_REGULAR = "plan_gtlFi4zoHPy80";      // $39.99
    const WHOP_PLAN_DISCOUNTED = "plan_9kPvCqLkwwmUc";  // $31.99 (20% off)
    
    const planId = discountValid ? WHOP_PLAN_DISCOUNTED : WHOP_PLAN_REGULAR;
    let whopUrl = `https://whop.com/checkout/${planId}?email=${encodeURIComponent(email)}`;
    
    // Store discount code in localStorage so webhook can mark it as used
    if (discountCode) {
      localStorage.setItem("pending_discount_code", discountCode.toUpperCase());
    }
    
    // Redirect to Whop checkout
    window.location.href = whopUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navigation */}
      <nav className="h-11 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">
          השלמת רכישה
        </h1>
        <p className="text-gray-500 text-center mb-8">
          תשלום חד פעמי · גישה לכל משך הפרויקט
        </p>

        {/* Price Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-medium">ShiputzAI Pro</span>
            <div className="text-left">
              <span className="text-gray-400 line-through text-sm">₪{ORIGINAL_PRICE}</span>
              <span className="text-2xl font-bold text-gray-900 mr-2">₪{SALE_PRICE}</span>
            </div>
          </div>
          
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              מעקב תקציב ללא הגבלה
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              סריקת קבלות AI
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              ניתוח הצעות מחיר
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              עוזר AI אישי
            </li>
          </ul>

          {discountValid && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="text-center">
                <div className="text-green-700 font-bold text-lg mb-2">🎉 הקוד תקף!</div>
                <div className="flex justify-center items-center gap-3">
                  <span className="text-gray-400 line-through text-lg">$39.99</span>
                  <span className="text-green-700 font-bold text-2xl">$31.99</span>
                </div>
                <div className="text-green-600 text-sm mt-1">חסכת {discountPercent}%!</div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-900">סה״כ לתשלום</span>
            <span className="text-2xl font-bold text-gray-900">₪{finalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">אימייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
            dir="ltr"
          />
        </div>

        {/* Discount Code */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">קוד הנחה (אופציונלי)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => {
                setDiscountCode(e.target.value.toUpperCase());
                setDiscountValid(null);
                setDiscountError("");
              }}
              placeholder="SHIP-XXXX-XXXXXX"
              className={`flex-1 px-4 py-3 border rounded-xl text-base focus:outline-none focus:border-gray-900 ${
                discountValid === true ? 'border-green-500 bg-green-50' : 
                discountValid === false ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              dir="ltr"
            />
            <button
              onClick={checkDiscountCode}
              disabled={checkingCode || !discountCode.trim()}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {checkingCode ? "..." : "בדוק"}
            </button>
          </div>
          {discountError && (
            <p className="text-red-500 text-sm mt-2">{discountError}</p>
          )}
          {discountValid && (
            <p className="text-green-600 text-sm mt-2">✓ קוד הנחה הופעל!</p>
          )}
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={loading || !email.trim()}
          className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "מעבד..." : `לתשלום ₪${finalPrice.toFixed(2)}`}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          התשלום מאובטח · ביטול תוך 14 יום
        </p>

        <p className="text-center text-xs text-gray-400 mt-6">
          תשלום מאובטח באמצעות Whop
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <p className="text-gray-500">טוען...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
