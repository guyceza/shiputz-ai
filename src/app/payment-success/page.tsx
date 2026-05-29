'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GOOGLE_ADS_CONVERSIONS,
  trackAnalyticsEvent,
  trackGoogleAdsConversion,
} from '@/lib/ads-tracking';
import { getCreditPackPrice } from '@/lib/credit-costs';
import { PLAN_PRICING } from '@/lib/plan-pricing';

const PURCHASE_VALUES: Record<string, number> = {
  plan_starter_monthly: PLAN_PRICING.starter.monthlyPrice,
  plan_pro_monthly: PLAN_PRICING.pro.monthlyPrice,
  plan_business_monthly: PLAN_PRICING.business.monthlyPrice,
  plan_starter_annual: PLAN_PRICING.starter.annualTotalPrice,
  plan_pro_annual: PLAN_PRICING.pro.annualTotalPrice,
  plan_business_annual: PLAN_PRICING.business.annualTotalPrice,
  credits_10: 10,
  credits_20: getCreditPackPrice(20),
  credits_50: getCreditPackPrice(50),
  credits_100: getCreditPackPrice(100),
  credits_200: getCreditPackPrice(200),
  credits_300: getCreditPackPrice(300),
  pack_10: getCreditPackPrice(10),
  pack_30: getCreditPackPrice(30),
  pack_100: getCreditPackPrice(100),
  pro: 99,
  premium: 299.99,
  vision: 39.99,
  premium_plus: 349.99,
};

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(8);
  const [verificationStatus, setVerificationStatus] = useState<'checking' | 'verified' | 'failed'>('checking');
  
  const product = searchParams.get('product') || 'premium';
  // PayPlus may pass page_request_uid in redirect URL, or we saved it in localStorage before redirect
  const pageRequestUid = searchParams.get('page_request_uid') 
    || searchParams.get('payment_request_uid')
    || (typeof window !== 'undefined' ? localStorage.getItem('payplus_page_request_uid') : null);

  useEffect(() => {
    if (verificationStatus !== 'verified' || typeof window === 'undefined') return;

    const transactionId = pageRequestUid || `no-uid-${product}`;
    const conversionKey = `gads_purchase_conversion_${transactionId}`;
    if (localStorage.getItem(conversionKey)) return;
    const value = PURCHASE_VALUES[product] || 1;

    const firePurchaseConversion = () => {
      if (localStorage.getItem(conversionKey)) {
        return false;
      }

      const fired = trackGoogleAdsConversion(GOOGLE_ADS_CONVERSIONS.purchase, {
        transaction_id: transactionId,
        value,
        currency: 'ILS',
      });
      if (!fired) return false;

      trackAnalyticsEvent('purchase', {
        transaction_id: transactionId,
        value,
        currency: 'ILS',
        items: [
          {
            item_id: product,
            item_name: product,
            price: value,
            quantity: 1,
          },
        ],
      });
      localStorage.setItem(conversionKey, '1');
      return true;
    };

    if (firePurchaseConversion()) return;

    let attempts = 0;
    const retryTimer = window.setInterval(() => {
      attempts += 1;
      if (firePurchaseConversion() || attempts >= 20) {
        window.clearInterval(retryTimer);
      }
    }, 250);

    return () => window.clearInterval(retryTimer);
  }, [verificationStatus, pageRequestUid, product]);

  useEffect(() => {
    // Verify payment via IPN check (fallback for when webhook doesn't fire)
    async function verifyPayment() {
      // Get email from localStorage (user is logged in)
      let userEmail = '';
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          userEmail = JSON.parse(userData).email || '';
        }
      } catch {}

      if (pageRequestUid) {
        try {
          console.log('Verifying payment via IPN check:', pageRequestUid);
          const res = await fetch('/api/payplus/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page_request_uid: pageRequestUid, email: userEmail, product: product }),
          });
          const data = await res.json();
          console.log('IPN check result:', data);
          if (data.success) {
            setVerificationStatus('verified');
          } else {
            // Try again after a short delay (payment might still be processing)
            setTimeout(async () => {
              try {
                const res2 = await fetch('/api/payplus/check', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ page_request_uid: pageRequestUid, email: userEmail, product: product }),
                });
                const data2 = await res2.json();
                setVerificationStatus(data2.success ? 'verified' : 'failed');
              } catch {
                setVerificationStatus('failed');
              }
            }, 3000);
          }
        } catch (error) {
          console.error('IPN check failed:', error);
          setVerificationStatus('failed');
        }
      } else {
        // No UID available - assume success (webhook should handle it)
        console.log('No page_request_uid in URL, relying on webhook');
        setVerificationStatus('verified');
      }
    }

    verifyPayment();

    // Update localStorage to reflect purchase
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.purchased = true;
        if (product === 'pro' || product === 'vision' || product === 'pro_monthly' || product === 'pro_annual') {
          user.vision_active = true;
        }
        if (product === 'pro' || product === 'premium_plus' || product === 'pro_monthly' || product === 'pro_annual') {
          user.vision_credits = 999; // Pro = unlimited
        }
        localStorage.setItem('user', JSON.stringify(user));
      }
      localStorage.removeItem('shiputzai_user');
      localStorage.removeItem('payplus_page_request_uid');
      localStorage.removeItem('payplus_product');
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
  }, [router, product, pageRequestUid]);

  const productNames: Record<string, string> = {
    pro: 'Pro',
    pro_monthly: 'Pro (legacy)',
    pro_annual: 'Pro (שנתי legacy)',
    pack_10: '10 קרדיטים',
    pack_30: '30 קרדיטים',
    pack_100: '100 קרדיטים',
    credits_20: '20 קרדיטים',
    credits_50: '50 קרדיטים',
    credits_100: '100 קרדיטים',
    credits_200: '200 קרדיטים',
    credits_300: '300 קרדיטים',
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

        {/* Referral CTA */}
        <div className="mt-6 bg-gradient-to-l from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 text-right">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎁</span>
            <h3 className="font-bold text-gray-900 text-sm">הזמינו חבר - שניכם מרוויחים!</h3>
          </div>
          <p className="text-xs text-gray-600 mb-3">שתפו את הלינק שלכם וקבלו <strong>20 קרדיטים חינם</strong> על כל חבר שנרשם</p>
          <Link
            href="/dashboard#referral"
            className="inline-block text-xs font-medium bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-all"
          >
            קבלו את הלינק שלכם
          </Link>
        </div>
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
