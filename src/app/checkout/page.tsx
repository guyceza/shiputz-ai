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

  const basePrice = isPremiumPlus ? 2 : 2; // TODO: Restore to 349.99 : 299.99 after testing
  const originalPrice = isPremiumPlus ? 699 : 599;
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
        // Save transaction UID for payment verification on success page
        if (data.transaction_uid) {
          localStorage.setItem('payplus_page_request_uid', data.transaction_uid);
          localStorage.setItem('payplus_product', productType);
        }
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
              <span className="text-gray-400 line-through text-4xl">₪{codeValid ? basePrice : originalPrice}</span>
              <span className="text-3xl font-bold text-gray-900">₪{price}</span>
            </div>
            
            <p className="text-gray-500 mt-2">
              {codeValid ? `הנחה ${discountPercent}% הופעלה` : 'תשלום חד פעמי'}
            </p>
          </div>

          {/* What's included - detailed */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>הדמיה אחת בחינם</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>טיפים ומאמרים</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>הזנת הוצאות ידנית</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>מעקב תקציב</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>סריקת קבלות</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>ניתוח הצעות מחיר</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>בדיקת חוזים</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>התראות חכמות</span>
              </div>
              <div className="flex items-start gap-0">
                <span className="flex-shrink-0 ml-0.5 text-gray-900">✓</span>
                <span>עוזר אישי</span>
              </div>
              <div className={`flex items-start gap-0 ${isPremiumPlus ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>
                <span className="flex-shrink-0 ml-0.5">{isPremiumPlus ? '✓' : '✗'}</span>
                <span>4 הדמיות במערכת AI Vision</span>
              </div>
              <div className={`flex items-start gap-0 ${isPremiumPlus ? 'text-gray-900 font-medium' : 'text-gray-300'}`}>
                <span className="flex-shrink-0 ml-0.5">{isPremiumPlus ? '✓' : '✗'}</span>
                <span>Shop the Look</span>
              </div>
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
              {/* Mastercard */}
              <svg className="h-7" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#F5F5F5"/>
                <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
                <path d="M19 6.5a6.97 6.97 0 0 0-2.5 5.5c0 2.2 1 4.2 2.5 5.5a6.97 6.97 0 0 0 2.5-5.5c0-2.2-1-4.2-2.5-5.5z" fill="#FF5F00"/>
              </svg>
              {/* Visa */}
              <svg className="h-7" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#F5F5F5"/>
                <path d="M15.5 15.5h-2l1.25-7.5h2l-1.25 7.5zm6.5-7.3c-.4-.15-.95-.3-1.7-.3-1.85 0-3.15.95-3.15 2.3 0 1 .95 1.55 1.65 1.9.75.35 1 .6 1 .9 0 .5-.6.7-1.15.7-.75 0-1.15-.1-1.8-.35l-.25-.1-.25 1.55c.45.2 1.25.35 2.1.35 1.95 0 3.25-.95 3.25-2.35 0-.8-.5-1.4-1.55-1.9-.65-.3-1.05-.55-1.05-.85 0-.3.35-.6 1.05-.6.6 0 1.05.15 1.4.3l.15.05.25-1.5zm4.85-.2h-1.45c-.45 0-.8.15-.95.55l-2.75 6.45h1.95l.4-1.05h2.35l.25 1.05h1.7l-1.5-7zm-2.15 4.55l.75-2 .4 2h-1.15zM13 8l-1.85 5.15-.2-.95c-.35-1.15-1.4-2.4-2.6-3l1.65 6.3h1.95L15 8h-2z" fill="#1A1F71"/>
                <path d="M9.15 8H6.1l-.05.15c2.35.6 3.9 2.05 4.55 3.75L10 8.55c-.1-.4-.4-.55-.85-.55z" fill="#F79E1B"/>
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
            {isPremiumPlus ? "רוצה רק Premium? ₪299.99" : "שדרג ל-Premium Plus עם 4 הדמיות"}
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
// force rebuild Thu Feb 26 09:46:32 UTC 2026
