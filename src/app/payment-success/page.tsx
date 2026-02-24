'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);
  
  const product = searchParams.get('product') || 'premium';

  useEffect(() => {
    // Update localStorage to reflect purchase
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('shiputzai_user');
      if (userData) {
        const user = JSON.parse(userData);
        user.purchased = true;
        if (product === 'vision') {
          user.vision_active = true;
        }
        if (product === 'premium_plus') {
          user.vision_credits = 2; // Bonus credits from Premium Plus
        }
        localStorage.setItem('shiputzai_user', JSON.stringify(user));
      }
    }

    // Countdown and redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, product]);

  const productNames: Record<string, string> = {
    premium: 'Premium',
    vision: 'AI Vision',
    premium_plus: 'Premium Plus',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          התשלום בוצע בהצלחה! 🎉
        </h1>
        
        <p className="text-gray-600 mb-6">
          תודה על הרכישה! כעת יש לך גישה ל-{productNames[product] || 'ShiputzAI'}.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500">
            מעביר אותך לאזור האישי בעוד {countdown} שניות...
          </p>
        </div>

        <Link 
          href="/dashboard"
          className="inline-block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors"
        >
          לאזור האישי
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="text-gray-500">טוען...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
