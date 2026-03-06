"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

// Same anchor points as pricing page
const CREDIT_ANCHORS = [
  { credits: 10, price: 10 },
  { credits: 20, price: 19 },
  { credits: 50, price: 42 },
  { credits: 100, price: 75 },
  { credits: 200, price: 129 },
  { credits: 300, price: 179 },
];

function getCreditPrice(credits: number): number {
  const anchors = CREDIT_ANCHORS;
  if (credits <= anchors[0].credits) return anchors[0].price;
  if (credits >= anchors[anchors.length - 1].credits) {
    const last = anchors[anchors.length - 1];
    return Math.round(credits * (last.price / last.credits));
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    if (credits >= anchors[i].credits && credits <= anchors[i + 1].credits) {
      const t = (credits - anchors[i].credits) / (anchors[i + 1].credits - anchors[i].credits);
      return Math.round(anchors[i].price + t * (anchors[i + 1].price - anchors[i].price));
    }
  }
  return 0;
}

// Plan config matching pricing page
const PLAN_CONFIG: Record<string, { name: string; monthlyPrice: number; annualPrice: number; credits: number }> = {
  starter: { name: "Starter", monthlyPrice: 29, annualPrice: 15, credits: 50 },
  pro: { name: "Pro", monthlyPrice: 79, annualPrice: 39, credits: 200 },
  business: { name: "Business", monthlyPrice: 199, annualPrice: 99, credits: 600 },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Parse URL params
  const planId = searchParams.get("plan"); // starter/pro/business
  const billing = (searchParams.get("billing") || "monthly") as "monthly" | "annual";
  const creditsParam = searchParams.get("credits"); // slider credits (number)

  // Legacy support
  const legacyProduct = searchParams.get("product");
  const legacyPack = searchParams.get("pack");

  const isPlan = planId && PLAN_CONFIG[planId];
  const isCredits = creditsParam && !isNaN(Number(creditsParam));

  // Calculate pricing
  let productLabel = "";
  let price = 0;
  let productType = "";
  let subtitle = "";

  if (isPlan) {
    const plan = PLAN_CONFIG[planId];
    price = billing === "annual" ? plan.annualPrice : plan.monthlyPrice;
    productLabel = `תוכנית ${plan.name}`;
    productType = `plan_${planId}_${billing}`;
    subtitle = billing === "annual"
      ? `₪${price * 12} לשנה · ${plan.credits} קרדיטים/חודש`
      : `${plan.credits} קרדיטים לחודש`;
  } else if (isCredits) {
    const credits = Number(creditsParam);
    price = getCreditPrice(credits);
    productLabel = `${credits} קרדיטים`;
    productType = `credits_${credits}`;
    subtitle = `₪${(price / credits).toFixed(2)} לקרדיט · תשלום חד-פעמי`;
  } else if (legacyPack) {
    // Legacy pack support
    const packs: Record<string, { name: string; price: number }> = {
      "20": { name: "20 קרדיטים", price: 19 },
      "60": { name: "60 קרדיטים", price: 49 },
      "200": { name: "200 קרדיטים", price: 129 },
    };
    const pack = packs[legacyPack];
    if (pack) {
      price = pack.price;
      productLabel = pack.name;
      productType = `credits_${legacyPack}`;
      subtitle = "תשלום חד-פעמי";
    }
  } else if (legacyProduct) {
    // Legacy product redirect
    productType = legacyProduct;
  }

  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email && user.id) {
            setEmail(user.email);
            setCheckingAuth(false);
            return;
          }
        }
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
          setCheckingAuth(false);
          return;
        }
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      } catch {
        router.push("/login?redirect=/pricing");
      }
    };
    checkAuth();
  }, [router]);

  const handlePurchase = async () => {
    if (!email.trim() || !productType) return;
    setLoading(true);

    try {
      const response = await fetch("/api/payplus/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType,
          email: email.toLowerCase(),
          billing,
        }),
      });

      const data = await response.json();

      if (data.success && data.payment_url) {
        if (data.transaction_uid) {
          localStorage.setItem("payplus_page_request_uid", data.transaction_uid);
          localStorage.setItem("payplus_product", productType);
        }
        window.location.href = data.payment_url;
      } else {
        throw new Error(data.error || "Failed to create payment link");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      alert("אירעה שגיאה. אנא נסה שוב.");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">בודק התחברות...</p>
        </div>
      </div>
    );
  }

  if (!productType) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <p className="text-gray-500 mb-4">לא נבחר מוצר</p>
          <Link href="/pricing" className="text-emerald-600 font-medium underline">
            חזרה לתמחור
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
          <Link href="/pricing" className="text-xs text-gray-500 hover:text-gray-700">
            חזרה לתמחור
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-6 pt-20 pb-12">
        {/* Product Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 mb-6">
          <div className="text-center mb-6">
            {isPlan && (
              <span className="inline-block bg-gray-900 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                {billing === "annual" ? "שנתי" : "חודשי"}
              </span>
            )}
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{productLabel}</h2>
            <div className="flex items-baseline justify-center gap-2 mt-3">
              {isPlan && billing === "annual" && (
                <span className="text-lg text-gray-400 line-through">₪{PLAN_CONFIG[planId!].monthlyPrice}</span>
              )}
              <span className="text-4xl font-bold text-gray-900">₪{price}</span>
              {isPlan && <span className="text-gray-400 text-sm">/לחודש</span>}
            </div>
            <p className="text-gray-500 text-sm mt-2">{subtitle}</p>
          </div>

          {/* Email */}
          <div className="mb-6">
            <label className="block text-sm text-gray-500 mb-2">מחובר בתור:</label>
            <div className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700" dir="ltr">
              {email}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 rounded-full text-sm font-bold transition-all disabled:opacity-50 shadow-lg"
          >
            {loading ? "מעבד..." : `לתשלום — ₪${isPlan && billing === "annual" ? price * 12 : price}`}
          </button>

          <p className="text-center text-gray-400 text-xs mt-3">
            {isPlan ? "מנוי מתחדש · ניתן לבטל בכל עת" : "תשלום חד-פעמי · לא מנוי"}
          </p>
        </div>

        {/* Trust */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4 text-gray-400">
            <span className="text-sm">מאובטח</span>
            <div className="flex gap-2 items-center">
              <svg className="h-7" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#F5F5F5"/>
                <circle cx="15" cy="12" r="7" fill="#EB001B"/>
                <circle cx="23" cy="12" r="7" fill="#F79E1B"/>
                <path d="M19 6.5a6.97 6.97 0 0 0-2.5 5.5c0 2.2 1 4.2 2.5 5.5a6.97 6.97 0 0 0 2.5-5.5c0-2.2-1-4.2-2.5-5.5z" fill="#FF5F00"/>
              </svg>
              <svg className="h-7" viewBox="0 0 38 24" fill="none">
                <rect width="38" height="24" rx="4" fill="#F5F5F5"/>
                <path d="M15.5 15.5h-2l1.25-7.5h2l-1.25 7.5zm6.5-7.3c-.4-.15-.95-.3-1.7-.3-1.85 0-3.15.95-3.15 2.3 0 1 .95 1.55 1.65 1.9.75.35 1 .6 1 .9 0 .5-.6.7-1.15.7-.75 0-1.15-.1-1.8-.35l-.25-.1-.25 1.55c.45.2 1.25.35 2.1.35 1.95 0 3.25-.95 3.25-2.35 0-.8-.5-1.4-1.55-1.9-.65-.3-1.05-.55-1.05-.85 0-.3.35-.6 1.05-.6.6 0 1.05.15 1.4.3l.15.05.25-1.5zm4.85-.2h-1.45c-.45 0-.8.15-.95.55l-2.75 6.45h1.95l.4-1.05h2.35l.25 1.05h1.7l-1.5-7zm-2.15 4.55l.75-2 .4 2h-1.15zM13 8l-1.85 5.15-.2-.95c-.35-1.15-1.4-2.4-2.6-3l1.65 6.3h1.95L15 8h-2z" fill="#1A1F71"/>
                <path d="M9.15 8H6.1l-.05.15c2.35.6 3.9 2.05 4.55 3.75L10 8.55c-.1-.4-.4-.55-.85-.55z" fill="#F79E1B"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
