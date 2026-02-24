"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  
  const isPremiumPlus = searchParams.get("plan") === "plus" || searchParams.get("plan") === "premium_plus";

  const basePrice = isPremiumPlus ? 179 : 149;
  const originalPrice = isPremiumPlus ? 359 : 299;
  const price = codeValid ? Math.round(basePrice * (100 - discountPercent)) / 100 : basePrice;

  // Pre-fill email and code from localStorage/URL
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.email) setEmail(user.email);
      const shiputzUser = JSON.parse(localStorage.getItem("shiputzai_user") || "{}");
      if (shiputzUser.email) setEmail(shiputzUser.email);
    } catch {}
    
    // Get code from URL
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setDiscountCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams]);

  // Auto-validate code when it's from URL and email is set
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl && email && !codeValid) {
      validateCode();
    }
  }, [email, searchParams]);

  const validateCode = async () => {
    if (!discountCode.trim() || !email.trim()) {
      setCodeError("נא להזין קוד ואימייל");
      return;
    }

    setCheckingCode(true);
    setCodeError("");
    setCodeValid(null);

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
        setCodeValid(true);
        setDiscountPercent(data.discount || 20);
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

    try {
      const productType = isPremiumPlus ? 'premium_plus' : 'premium';
      
      const response = await fetch("/api/payplus/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          email: email.toLowerCase(),
          discountCode: codeValid ? discountCode.toUpperCase() : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert('אירעה שגיאה. אנא נסה שוב.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]" dir="rtl">
      {/* Minimal Header */}
      <div className="pt-8 pb-4 text-center">
        <Link href="/" className="text-xl font-semibold text-gray-900">
          ShiputzAI
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-6 py-8">
        
        {/* Product Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-6">
          
          {/* Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              {isPremiumPlus ? '⭐ Premium Plus' : 'Premium'}
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-400 line-through text-2xl">₪{codeValid ? basePrice : originalPrice}</span>
              <span className="text-5xl font-bold text-gray-900">₪{price}</span>
            </div>
            
            <p className="text-green-600 font-medium mt-2">
              {codeValid ? `🎉 ${discountPercent}% הנחה!` : '💳 תשלום חד פעמי'}
            </p>
          </div>

          {/* What's included - minimal */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <span>מעקב תקציב + סריקת קבלות AI</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-lg">✓</span>
                <span>ניתוח הצעות מחיר + עוזר AI</span>
              </div>
              {isPremiumPlus && (
                <div className="flex items-center gap-3 text-purple-700 font-medium">
                  <span className="text-purple-500 text-lg">✓</span>
                  <span>2 הדמיות AI מתנה</span>
                </div>
              )}
            </div>
          </div>

          {/* Email Input */}
          <div className="mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="האימייל שלך"
              className="w-full px-4 py-4 bg-gray-50 border-0 rounded-xl text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
              dir="ltr"
            />
          </div>

          {/* Discount Code */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setCodeValid(null);
                  setCodeError("");
                }}
                placeholder="קוד הנחה (אופציונלי)"
                className={`flex-1 px-4 py-3 bg-gray-50 border-0 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                  codeValid === true ? 'ring-2 ring-green-500 bg-green-50' : 
                  codeValid === false ? 'ring-2 ring-red-300 bg-red-50' : ''
                }`}
                dir="ltr"
              />
              <button
                onClick={validateCode}
                disabled={checkingCode || !discountCode.trim() || !email.trim()}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {checkingCode ? "..." : "בדוק"}
              </button>
            </div>
            {codeError && (
              <p className="text-red-500 text-sm mt-2">{codeError}</p>
            )}
            {codeValid && (
              <p className="text-green-600 text-sm mt-2">✓ קוד הנחה הופעל - {discountPercent}% הנחה!</p>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={handlePurchase}
            disabled={loading || !email.trim()}
            className="w-full bg-gray-900 text-white py-4 rounded-xl text-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "מעבד..." : `לתשלום ₪${price}`}
          </button>
        </div>

        {/* Trust - minimal */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <span className="text-sm">🔒 מאובטח</span>
            <div className="flex gap-2 items-center">
              {/* Visa - simple text logo */}
              <div className="h-6 px-2 bg-[#1A1F71] rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold italic tracking-tight">VISA</span>
              </div>
              {/* Mastercard */}
              <svg className="h-6" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#F5F5F5"/>
                <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
                <path d="M19 6.5a6.97 6.97 0 0 0-2.5 5.5c0 2.2 1 4.2 2.5 5.5a6.97 6.97 0 0 0 2.5-5.5c0-2.2-1-4.2-2.5-5.5z" fill="#FF5F00"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Switch plan link */}
        <div className="text-center mt-6">
          <Link 
            href={isPremiumPlus ? "/checkout" : "/checkout?plan=plus"}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {isPremiumPlus ? "רוצה רק Premium? ₪149" : "שדרג ל-Premium Plus עם 2 הדמיות AI →"}
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
