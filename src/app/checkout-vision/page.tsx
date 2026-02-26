"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const REGULAR_PRICE = 39.99;  // ₪39.99
const DISCOUNT_PRICE = 19.99; // ₪19.99 first month with discount

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

  // Check if user is logged in AND has main subscription
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage first
        const userData = localStorage.getItem("user");
        const shiputzUserData = localStorage.getItem("shiputzai_user");
        
        let userEmail = "";
        let isPurchased = false;
        
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email && user.id) {
            userEmail = user.email;
            isPurchased = user.purchased === true;
          }
        }
        
        if (shiputzUserData) {
          const shiputzUser = JSON.parse(shiputzUserData);
          if (shiputzUser.email) {
            userEmail = shiputzUser.email;
            isPurchased = isPurchased || shiputzUser.purchased === true;
          }
        }
        
        // If no email found, check Supabase session
        if (!userEmail) {
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          
          if (session?.user?.email) {
            userEmail = session.user.email;
          }
        }
        
        // Not logged in - redirect to login
        if (!userEmail) {
          const code = searchParams.get("code") || "";
          const redirectUrl = `/checkout-vision${code ? `?code=${code}` : ""}`;
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
          return;
        }
        
        setEmail(userEmail);
        setHasPurchased(isPurchased);
        setCheckingAuth(false);
        
      } catch (e) {
        console.error("Auth check failed:", e);
        router.push("/login?redirect=/checkout-vision");
      }
    };
    
    checkAuth();
    
    // Get code from URL
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setDiscountCode(codeFromUrl.toUpperCase());
    }
  }, [searchParams, router]);

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

    try {
      // Create PayPlus payment link for Vision subscription
      const response = await fetch("/api/payplus/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: 'vision',
          email: email.toLowerCase(),
          discountCode: codeValid ? discountCode.toUpperCase() : undefined,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.payment_url) {
        // Redirect to PayPlus payment page
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
            {/* Animated illustration */}
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                <span className="text-4xl animate-bounce" style={{ animationDuration: '2s' }}>🔐</span>
              </div>
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
              רכוש ShiputzAI ב-₪299.99
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

        {/* Email Display (read-only - user must be logged in) */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">מחובר בתור:</label>
          <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-base text-gray-700" dir="ltr">
            {email}
          </div>
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
          🔒 תשלום מאובטח בכרטיס אשראי
        </p>
        
        {/* Payment methods icons - Credit cards only for recurring */}
        <div className="flex justify-center items-center gap-3 mt-4">
          {/* Visa */}
          <svg className="h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#1A1F71"/>
            <path d="M19.5 21H17L18.75 11H21.25L19.5 21Z" fill="white"/>
            <path d="M28.5 11.25C28 11.05 27.2 10.85 26.2 10.85C23.7 10.85 22 12.15 22 13.95C22 15.3 23.2 16.05 24.1 16.5C25 16.95 25.3 17.25 25.3 17.65C25.3 18.25 24.6 18.55 23.95 18.55C23 18.55 22.5 18.4 21.7 18.05L21.35 17.9L21 20.1C21.6 20.35 22.65 20.6 23.75 20.6C26.4 20.6 28.05 19.3 28.05 17.4C28.05 16.35 27.4 15.55 26.05 14.9C25.25 14.5 24.75 14.2 24.75 13.75C24.75 13.35 25.2 12.9 26.15 12.9C26.95 12.9 27.55 13.1 28 13.3L28.25 13.4L28.5 11.25Z" fill="white"/>
            <path d="M32.5 11H30.5C29.9 11 29.45 11.15 29.15 11.75L25.5 21H28.15L28.65 19.55H31.85L32.15 21H34.5L32.5 11ZM29.35 17.55C29.55 17 30.35 14.85 30.35 14.85C30.35 14.85 30.55 14.3 30.7 13.95L30.85 14.75C30.85 14.75 31.35 17.05 31.45 17.55H29.35Z" fill="white"/>
            <path d="M16.5 11L14 17.85L13.7 16.4C13.2 14.8 11.7 13.05 10 12.15L12.25 21H15L19.5 11H16.5Z" fill="white"/>
            <path d="M12 11H8.05L8 11.2C11.25 12 13.4 14.1 14.2 16.4L13.35 11.8C13.2 11.2 12.75 11.02 12 11Z" fill="#F9A51A"/>
          </svg>
          
          {/* Mastercard */}
          <svg className="h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#F5F5F5"/>
            <circle cx="19" cy="16" r="8" fill="#EB001B"/>
            <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
            <path d="M24 10.5C25.8 12 27 14.3 27 16.9C27 19.5 25.8 21.8 24 23.3C22.2 21.8 21 19.5 21 16.9C21 14.3 22.2 12 24 10.5Z" fill="#FF5F00"/>
          </svg>
        </div>
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
