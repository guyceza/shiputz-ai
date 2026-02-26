"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [discountCode, setDiscountCode] = useState("");
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  
  const isPremiumPlus = searchParams.get("plan") === "plus" || searchParams.get("plan") === "premium_plus";

  const basePrice = isPremiumPlus ? 179 : 149;
  const originalPrice = isPremiumPlus ? 359 : 299;
  const price = codeValid ? Math.round(basePrice * (100 - discountPercent) / 100) : basePrice;

  // Check if user is logged in - MUST be logged in to checkout
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage first
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email && user.id) {
            setEmail(user.email);
            setCheckingAuth(false);
            return;
          }
        }
        
        // Check Supabase session
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        
        if (session?.user?.email) {
          setEmail(session.user.email);
          setCheckingAuth(false);
          return;
        }
        
        // Not logged in - redirect to login
        const plan = isPremiumPlus ? "plus" : "";
        const code = searchParams.get("code") || "";
        const redirectUrl = `/checkout${plan ? `?plan=${plan}` : ""}${code ? `${plan ? "&" : "?"}code=${code}` : ""}`;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      } catch (e) {
        console.error("Auth check failed:", e);
        router.push("/login?redirect=/checkout");
      }
    };
    
    checkAuth();
  }, [router, isPremiumPlus, searchParams]);

  // Get discount code from URL
  useEffect(() => {
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

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">בודק התחברות...</p>
        </div>
      </div>
    );
  }

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
            <div className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium mb-4">
              {isPremiumPlus ? 'Premium Plus' : 'Premium'}
            </div>
            
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-bold text-gray-900">₪{price}</span>
              <span className="text-gray-400 line-through text-2xl">₪{codeValid ? basePrice : originalPrice}</span>
            </div>
            
            <p className="text-gray-500 mt-2">
              {codeValid ? `הנחה ${discountPercent}% הופעלה` : 'תשלום חד פעמי'}
            </p>
          </div>

          {/* What's included - detailed */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>מעקב תקציב ללא הגבלה</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>סריקת קבלות אוטומטית</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>ניתוח הצעות מחיר</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>בדיקת חוזים</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>התראות חכמות</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>עוזר אישי</span>
              </div>
              {isPremiumPlus && (
                <>
                  <div className="flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>הדמיית חדר</span>
                  </div>
                  <div className="flex items-center gap-3 font-medium">
                    <svg className="w-4 h-4 text-gray-900 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>2 הדמיות כלולות</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Email Display (read-only - user must be logged in) */}
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-2">מחובר בתור:</label>
            <div className="w-full px-4 py-4 bg-gray-100 border-0 rounded-xl text-base text-gray-700" dir="ltr">
              {email}
            </div>
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
                  codeValid === true ? 'ring-2 ring-gray-900 bg-gray-100' : 
                  codeValid === false ? 'ring-2 ring-gray-400 bg-gray-50' : ''
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
              <p className="text-gray-500 text-sm mt-2">{codeError}</p>
            )}
            {codeValid && (
              <p className="text-gray-700 text-sm mt-2">קוד הנחה הופעל - {discountPercent}% הנחה</p>
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
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <span className="text-sm">מאובטח</span>
            <div className="flex gap-2 items-center">
              {/* Visa */}
              <div className="h-6 px-2 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold italic tracking-tight">VISA</span>
              </div>
              {/* Mastercard */}
              <div className="h-6 px-2 bg-gray-800 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold tracking-tight">MC</span>
              </div>
            </div>
          </div>
        </div>

        {/* Switch plan link */}
        <div className="text-center mt-6">
          <Link 
            href={isPremiumPlus ? "/checkout" : "/checkout?plan=plus"}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            {isPremiumPlus ? "רוצה רק Premium? ₪149" : "שדרג ל-Premium Plus עם 2 הדמיות"}
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
