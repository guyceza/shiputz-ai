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

  // Check if user has main subscription and pre-fill code from URL
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.email) setEmail(user.email);
      
      // Also try shiputzai_user
      const shiputzUser = JSON.parse(localStorage.getItem("shiputzai_user") || "{}");
      if (shiputzUser.email) setEmail(shiputzUser.email);
      
      if (user.purchased === true || shiputzUser.purchased === true) {
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
          🔒 תשלום מאובטח
        </p>
        
        {/* Payment methods icons */}
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

          {/* Apple Pay */}
          <svg className="h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#000"/>
            <path d="M15.2 12.3C15.7 11.7 16 10.9 15.9 10.1C15.2 10.2 14.3 10.6 13.8 11.2C13.3 11.7 12.9 12.6 13 13.3C13.8 13.4 14.6 12.9 15.2 12.3Z" fill="white"/>
            <path d="M15.9 13.5C14.7 13.4 13.7 14.2 13.1 14.2C12.5 14.2 11.6 13.5 10.6 13.5C9.3 13.6 8.1 14.3 7.4 15.4C6 17.7 7 21.1 8.4 23C9.1 24 9.9 25 10.9 25C11.9 25 12.3 24.3 13.4 24.3C14.5 24.3 14.9 25 15.9 25C16.9 25 17.7 24 18.4 23C19 22.2 19.3 21.4 19.3 21.3C19.3 21.3 17.5 20.6 17.5 18.5C17.5 16.7 18.9 15.9 19 15.8C18.1 14.5 16.8 14.3 16.4 14.3C15.5 14.2 14.6 14.7 14.1 14.7C13.6 14.7 12.8 14.3 12 14.3C13.4 14.3 14.6 13.6 15.3 12.5C15.5 12.2 15.8 12.3 15.9 13.5Z" fill="white"/>
            <path d="M24 14.2H25.2C26.4 14.2 27.2 14.9 27.2 16C27.2 17.1 26.4 17.8 25.2 17.8H24V14.2ZM22.5 13V21H24V19H25.3C27.2 19 28.7 17.7 28.7 15.9C28.7 14.2 27.3 13 25.4 13H22.5ZM32.5 21.1C31.2 21.1 30.2 20.4 30.2 19.3C30.2 18.2 31 17.6 32.5 17.5L34.5 17.4V16.9C34.5 16.1 34 15.7 33.1 15.7C32.3 15.7 31.8 16.1 31.7 16.6H30.3C30.4 15.3 31.5 14.4 33.2 14.4C34.9 14.4 36 15.3 36 16.7V21H34.6V19.9H34.5C34.1 20.7 33.3 21.1 32.5 21.1ZM32.8 19.9C33.7 19.9 34.5 19.3 34.5 18.4V18.4L32.7 18.5C31.9 18.6 31.5 18.9 31.5 19.4C31.5 19.8 32 20 32.8 19.9ZM38 23.5C37.8 23.5 37.5 23.5 37.3 23.4V22.2C37.5 22.2 37.7 22.3 37.9 22.3C38.6 22.3 38.9 22 39.2 21.2L39.3 21L37 14.5H38.6L40.2 19.6H40.2L41.8 14.5H43.4L41 21.4C40.4 23 39.6 23.5 38 23.5Z" fill="white"/>
          </svg>

          {/* Google Pay */}
          <svg className="h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#F5F5F5" stroke="#E0E0E0"/>
            <path d="M23.5 16.5V19H22V12H25C25.8 12 26.5 12.3 27 12.8C27.5 13.3 27.8 14 27.8 14.8C27.8 15.6 27.5 16.2 27 16.7C26.5 17.2 25.8 17.5 25 17.5H23.5V16.5ZM23.5 13.2V16.3H25C25.5 16.3 25.9 16.1 26.2 15.8C26.5 15.5 26.6 15.2 26.6 14.8C26.6 14.4 26.5 14 26.2 13.7C25.9 13.4 25.5 13.2 25 13.2H23.5Z" fill="#5F6368"/>
            <path d="M31 14.5C31.8 14.5 32.4 14.7 32.9 15.2L32 16C31.6 15.6 31.2 15.5 30.7 15.5C30.2 15.5 29.7 15.7 29.3 16.1C29 16.5 28.8 17 28.8 17.6C28.8 18.2 29 18.7 29.3 19.1C29.7 19.5 30.1 19.7 30.7 19.7C31.3 19.7 31.8 19.5 32.1 19L33 19.8C32.4 20.5 31.6 20.8 30.6 20.8C29.6 20.8 28.8 20.5 28.2 19.8C27.6 19.2 27.3 18.4 27.3 17.5C27.3 16.6 27.6 15.8 28.2 15.2C28.9 14.7 29.8 14.5 31 14.5Z" fill="#5F6368"/>
            <path d="M35 20.7V12H36.5V20.7H35Z" fill="#5F6368"/>
            <path d="M13.5 17.4V16.2H17.3C17.3 16.4 17.4 16.7 17.4 17C17.4 17.9 17.1 18.7 16.5 19.3C15.9 19.9 15.1 20.2 14 20.2C13 20.2 12.1 19.8 11.4 19.1C10.7 18.4 10.3 17.5 10.3 16.4C10.3 15.3 10.7 14.4 11.4 13.7C12.1 13 13 12.6 14 12.6C15 12.6 15.9 13 16.5 13.6L15.6 14.5C15.2 14.1 14.6 13.8 14 13.8C13.3 13.8 12.7 14.1 12.2 14.6C11.7 15.1 11.5 15.7 11.5 16.4C11.5 17.1 11.7 17.7 12.2 18.2C12.7 18.7 13.3 19 14.1 19C14.8 19 15.3 18.8 15.7 18.4C16 18.1 16.2 17.7 16.2 17.3H14L13.5 17.4Z" fill="#4285F4"/>
            <path d="M20 14.6C20.8 14.6 21.4 14.9 21.9 15.4C22.4 15.9 22.6 16.6 22.6 17.5C22.6 18.4 22.3 19.1 21.9 19.6C21.4 20.1 20.8 20.4 20 20.4C19.2 20.4 18.5 20.1 18 19.6C17.5 19.1 17.3 18.4 17.3 17.5C17.3 16.6 17.6 15.9 18 15.4C18.6 14.9 19.2 14.6 20 14.6ZM20 15.8C19.6 15.8 19.2 16 19 16.3C18.7 16.7 18.6 17 18.6 17.5C18.6 18 18.7 18.4 19 18.7C19.2 19 19.6 19.2 20 19.2C20.4 19.2 20.8 19 21 18.7C21.2 18.4 21.4 18 21.4 17.5C21.4 17 21.3 16.6 21 16.3C20.7 16 20.4 15.8 20 15.8Z" fill="#EA4335"/>
            <path d="M25.7 14.6C26.5 14.6 27.1 14.9 27.6 15.4C28.1 15.9 28.3 16.6 28.3 17.5C28.3 18.4 28 19.1 27.6 19.6C27.1 20.1 26.5 20.4 25.7 20.4C24.9 20.4 24.2 20.1 23.7 19.6C23.2 19.1 23 18.4 23 17.5C23 16.6 23.3 15.9 23.7 15.4C24.3 14.9 24.9 14.6 25.7 14.6ZM25.7 15.8C25.3 15.8 24.9 16 24.7 16.3C24.4 16.7 24.3 17 24.3 17.5C24.3 18 24.4 18.4 24.7 18.7C24.9 19 25.3 19.2 25.7 19.2C26.1 19.2 26.5 19 26.7 18.7C26.9 18.4 27.1 18 27.1 17.5C27.1 17 27 16.6 26.7 16.3C26.4 16 26.1 15.8 25.7 15.8Z" fill="#FBBC05"/>
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
