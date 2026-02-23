"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const REGULAR_PRICE = 39.99;  // ₪39.99
const DISCOUNT_PRICE = 19.99; // ₪19.99 first month (displayed) = $5.99 in Whop
const WHOP_PLAN_REGULAR = "plan_ORVfC8pmG328G"; // AI Vision monthly plan - $11.99/month
const WHOP_PLAN_DISCOUNTED = "plan_786h1Ueozm30s"; // AI Vision discounted - $5.99 first month

function CheckoutVisionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPurchased, setHasPurchased] = useState<boolean | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user has main subscription and pre-fill code from URL
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.email) setEmail(user.email);
      
      if (user.purchased === true) {
        setHasPurchased(true);
      } else {
        setHasPurchased(false);
      }
    } catch {
      setHasPurchased(false);
    }
    setCheckingAuth(false);
    
    // Get code from URL
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setDiscountCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Auto-validate code when it's from URL
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && email) {
      validateCode();
    }
  }, [email, searchParams]);

  const validateCode = async () => {
    if (!discountCode.trim()) {
      setCodeError("נא להזין קוד הנחה");
      return;
    }

    setCheckingCode(true);
    setCodeError("");
    setCodeValid(null);

    try {
      const response = await fetch("/api/discount-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          code: discountCode.toUpperCase(), 
          email: email.toLowerCase() 
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setCodeValid(true);
      } else {
        setCodeValid(false);
        setCodeError(data.reason || "קוד לא תקף");
      }
    } catch (err) {
      setCodeError("שגיאה בבדיקת הקוד");
    }

    setCheckingCode(false);
  };

  const handlePurchase = async () => {
    if (!email.trim()) {
      alert("נא להזין אימייל");
      return;
    }

    setLoading(true);

    // Use discounted plan if code is valid
    const planId = codeValid ? WHOP_PLAN_DISCOUNTED : WHOP_PLAN_REGULAR;
    const checkoutUrl = `https://whop.com/checkout/${planId}?email=${encodeURIComponent(email)}`;
    window.location.href = checkoutUrl;
  };

  const finalPrice = codeValid ? DISCOUNT_PRICE : REGULAR_PRICE;

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
              שירות Vision דורש מנוי ShiputzAI
            </h1>
            <p className="text-gray-500 mb-8">
              כדי לרכוש את מנוי Vision, צריך קודם חשבון ShiputzAI פעיל
            </p>
            
            <Link
              href="/checkout"
              className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all mb-4"
            >
              הצטרף ל-ShiputzAI · ₪149.99
            </Link>
            
            <p className="text-xs text-gray-400">
              תשלום חד פעמי · אחרי זה תוכל להוסיף Vision
            </p>
          </div>
        </div>
      </div>
    );
  }

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
          מנוי הדמיות AI
        </h1>
        <p className="text-gray-500 text-center mb-8">
          מנוי חודשי · AI עריכת תמונות
        </p>

        {/* Price Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-900 font-medium">ShiputzAI Vision</span>
            <div className="text-left">
              {codeValid && (
                <span className="text-gray-400 line-through text-sm">₪{REGULAR_PRICE}</span>
              )}
              <span className="text-2xl font-bold text-gray-900 mr-2">₪{finalPrice}</span>
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
              10 הדמיות בחודש
            </li>
          </ul>

          {codeValid && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <div className="text-center">
                <div className="text-green-700 font-bold text-lg mb-2">🎉 הקוד הופעל!</div>
                <div className="flex justify-center items-center gap-3">
                  <span className="text-gray-400 line-through text-lg">₪{REGULAR_PRICE}</span>
                  <span className="text-green-700 font-bold text-2xl">₪{DISCOUNT_PRICE}</span>
                </div>
                <div className="text-green-600 text-sm mt-1">לחודש הראשון · אח״כ ₪{REGULAR_PRICE}/חודש</div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <span className="font-semibold text-gray-900">סה״כ לתשלום</span>
            <div>
              <span className="text-2xl font-bold text-gray-900">₪{finalPrice}</span>
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

        {/* Discount Code */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">קוד הנחה (אופציונלי)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => {
                setDiscountCode(e.target.value.toUpperCase());
                setCodeValid(null);
                setCodeError("");
              }}
              placeholder="VIS-XXXX-XXXXXX"
              className={`flex-1 px-4 py-3 border rounded-xl text-base focus:outline-none focus:border-gray-900 ${
                codeValid === true ? 'border-green-500 bg-green-50' : 
                codeValid === false ? 'border-red-300 bg-red-50' : 'border-gray-200'
              }`}
              dir="ltr"
            />
            <button
              onClick={validateCode}
              disabled={checkingCode || !discountCode.trim()}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {checkingCode ? "..." : "בדוק"}
            </button>
          </div>
          {codeError && (
            <p className="text-red-500 text-sm mt-2">{codeError}</p>
          )}
          {codeValid && (
            <p className="text-green-600 text-sm mt-2">✓ קוד הנחה הופעל - 50% לחודש הראשון!</p>
          )}
        </div>

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={loading || !email.trim()}
          className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? "מעבד..." : `לתשלום ₪${finalPrice}/חודש`}
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
