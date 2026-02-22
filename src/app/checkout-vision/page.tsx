"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const REGULAR_PRICE = 40;
const PROMO_PRICE = 19.99;
const PROMO_CODE = "LAUNCH50";
const WHOP_PLAN_ID = "plan_CEViCUDUhJnZ2"; // AI Vision monthly plan

function CheckoutVisionContent() {
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState(PROMO_CODE);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Pre-fill email from localStorage
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.email) setEmail(user.email);
    } catch {}
  }, []);

  const copyPromoCode = async () => {
    await navigator.clipboard.writeText(PROMO_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePurchase = async () => {
    if (!email.trim()) {
      alert("נא להזין אימייל");
      return;
    }

    setLoading(true);

    // Redirect to Whop checkout with email
    const checkoutUrl = `https://whop.com/checkout/${WHOP_PLAN_ID}?email=${encodeURIComponent(email)}`;
    window.location.href = checkoutUrl;
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
          מנוי חודשי · AI עריכת תמונות
        </p>

        {/* Price Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-medium">ShiputzAI Vision</span>
            <div className="text-left">
              <span className="text-gray-400 line-through text-sm">₪{REGULAR_PRICE}</span>
              <span className="text-2xl font-bold text-gray-900 mr-2">₪{PROMO_PRICE}</span>
              <span className="text-gray-500 text-sm">/חודש</span>
            </div>
          </div>
          
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              הדמיות ויזואליות של השיפוץ
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              הערכת עלויות לפי תמונה
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Shop the Look — קנה את הסגנון
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              עריכות ללא הגבלה
            </li>
          </ul>

          {/* Promo applied notice */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 mb-4 text-white">
            <div className="text-center">
              <div className="text-sm opacity-90 mb-1">מחיר מיוחד למנויי ShiputzAI</div>
              <div className="flex justify-center items-center gap-3">
                <span className="opacity-70 line-through text-lg">₪{REGULAR_PRICE}</span>
                <span className="font-bold text-3xl">₪{PROMO_PRICE}</span>
                <span className="opacity-90">/חודש</span>
              </div>
              <div className="text-xs opacity-80 mt-2">לחודש הראשון · לאחר מכן ₪{REGULAR_PRICE}/חודש</div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-900">סה״כ לתשלום</span>
            <div>
              <span className="text-2xl font-bold text-gray-900">₪{PROMO_PRICE}</span>
              <span className="text-gray-500 text-sm">/חודש</span>
            </div>
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

        {/* Promo Code Display */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">קוד הנחה</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              readOnly
              className="flex-1 px-4 py-3 border border-green-300 bg-green-50 rounded-xl text-base text-green-800 font-medium"
              dir="ltr"
            />
            <button
              onClick={copyPromoCode}
              className="px-4 py-3 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-colors"
            >
              {copied ? "✓" : "העתק"}
            </button>
          </div>
          <p className="text-green-600 text-sm mt-2">✓ הקוד יופעל אוטומטית בעמוד התשלום</p>
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={loading || !email.trim()}
          className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "מעבד..." : `לתשלום ₪${PROMO_PRICE}/חודש`}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          ביטול בכל עת · ללא התחייבות
        </p>

        <p className="text-center text-xs text-gray-400 mt-6">
          תשלום מאובטח באמצעות Whop
        </p>
      </div>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function CheckoutVisionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <p className="text-gray-500">טוען...</p>
      </div>
    }>
      <CheckoutVisionContent />
    </Suspense>
  );
}
