"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 15,
    credits: 50,
    features: [
      "50 קרדיטים לחודש",
      "הדמיות AI לחדרים",
      "כתב כמויות אוטומטי",
      "החלפת רהיטים",
      "Shop the Look",
      "סריקת קבלות",
    ],
    cta: "התחל עכשיו",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 79,
    annualPrice: 39,
    credits: 200,
    badge: "הכי פופולרי",
    features: [
      "200 קרדיטים לחודש",
      "כל הכלים כולל סרטון סיור",
      "הדמיית תוכנית קומה",
      "קניית קרדיטים נוספים",
      "שימוש מסחרי",
      "ניתוח הצעות מחיר",
    ],
    cta: "התחל עכשיו",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 199,
    annualPrice: 99,
    credits: 600,
    features: [
      "600 קרדיטים לחודש",
      "כל הכלים ללא הגבלה",
      "סרטוני סיור ללא הגבלה",
      "קניית קרדיטים נוספים",
      "שימוש מסחרי",
      "תמיכה עדיפה",
    ],
    cta: "התחל עכשיו",
    highlighted: false,
  },
];

const CREDIT_COSTS = [
  { action: "הדמיית חדר", credits: 10, icon: "🎨" },
  { action: "הדמיית תוכנית קומה", credits: 10, icon: "📐" },
  { action: "צילום חדר מתוכנית", credits: 5, icon: "🏠" },
  { action: "החלפת רהיט", credits: 5, icon: "🪑" },
  { action: "סרטון סיור", credits: 25, icon: "🎬" },
  { action: "Shop the Look", credits: 3, icon: "🛒" },
  { action: "כתב כמויות", credits: 5, icon: "📋" },
  { action: "סריקת קבלה", credits: 2, icon: "🧾" },
  { action: "ניתוח הצעת מחיר", credits: 3, icon: "📊" },
];

// Slider credit pricing - anchor points for interpolation
const CREDIT_ANCHORS = [
  { credits: 10, price: 10 },   // ₪1.00/credit
  { credits: 20, price: 19 },   // ₪0.95
  { credits: 50, price: 42 },   // ₪0.84
  { credits: 100, price: 75 },  // ₪0.75
  { credits: 200, price: 129 }, // ₪0.65
  { credits: 300, price: 179 }, // ₪0.60
];

const SLIDER_STEPS = [10, 20, 30, 50, 75, 100, 150, 200, 250, 300];

function getPrice(credits: number): number {
  const anchors = CREDIT_ANCHORS;
  if (credits <= anchors[0].credits) return anchors[0].price;
  if (credits >= anchors[anchors.length - 1].credits) {
    const last = anchors[anchors.length - 1];
    const perCredit = last.price / last.credits;
    return Math.round(credits * perCredit);
  }
  for (let i = 0; i < anchors.length - 1; i++) {
    if (credits >= anchors[i].credits && credits <= anchors[i + 1].credits) {
      const t = (credits - anchors[i].credits) / (anchors[i + 1].credits - anchors[i].credits);
      return Math.round(anchors[i].price + t * (anchors[i + 1].price - anchors[i].price));
    }
  }
  return 0;
}

const FAQ = [
  {
    q: "מה זה קרדיטים?",
    a: "קרדיטים הם המטבע הפנימי של ShiputzAI. כל פעולה צורכת מספר קרדיטים בהתאם למורכבות שלה. למשל, הדמיית חדר עולה 10 קרדיטים וסרטון סיור עולה 25.",
  },
  {
    q: "האם הקרדיטים מצטברים?",
    a: "כן! קרדיטים שלא נוצלו עוברים לחודש הבא. בנוסף, אפשר לרכוש חבילות קרדיטים נוספות בכל עת.",
  },
  {
    q: "אפשר לנסות בחינם?",
    a: "בהחלט! כל משתמש חדש מקבל 10 קרדיטים בחינם — מספיק להדמיה אחת מלאה. אחרי הרשמה מקבלים עוד 10.",
  },
  {
    q: "איך משדרגים או מבטלים?",
    a: "אפשר לשדרג בכל רגע — הקרדיטים החדשים נוספים מיד. ביטול נכנס לתוקף בסוף תקופת החיוב.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sliderIndex, setSliderIndex] = useState(3); // default to 50 credits
  const sliderCredits = SLIDER_STEPS[sliderIndex];
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id) {
          setIsLoggedIn(true);
          if (user.email) {
            fetch(`/api/credits?email=${encodeURIComponent(user.email)}`)
              .then(r => r.json())
              .then(d => {
                setUserCredits(d.credits);
                setUserPlan(d.plan || "free");
              })
              .catch(() => {});
          }
        }
      }
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
          <div className="flex items-center gap-3">
            {isLoggedIn && userCredits !== null && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-medium">
                {userCredits} קרדיטים
              </span>
            )}
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all">
                התחברות
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            שלמו רק על מה שאתם <span className="text-emerald-600">משתמשים</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            קנו קרדיטים או בחרו מנוי חודשי — בלי התחייבות, בלי הפתעות
          </p>

          {/* Trial badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-2 mb-10">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-800 font-medium">10 קרדיטים בחינם לכל משתמש חדש</span>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="px-4 pb-6">
        <div className="flex justify-center">
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billingCycle === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              חודשי
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                billingCycle === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              שנתי
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                עד 50% הנחה
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
            const perCredit = (price / plan.credits).toFixed(2);
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 p-6 transition-all ${
                  plan.highlighted
                    ? "border-gray-900 shadow-xl scale-[1.02]"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    {billingCycle === "annual" && (
                      <span className="text-lg text-gray-400 line-through">₪{plan.monthlyPrice}</span>
                    )}
                    <span className="text-4xl font-bold text-gray-900">₪{price}</span>
                    <span className="text-gray-400 text-sm">/לחודש</span>
                  </div>
                  {billingCycle === "annual" && (
                    <div className="text-xs text-gray-400 mt-1">
                      ₪{price * 12} לשנה
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-emerald-600">{plan.credits} קרדיטים</span>
                    <span className="text-xs text-gray-400">(₪{perCredit} לקרדיט)</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={isLoggedIn ? `/checkout?plan=${plan.id}&billing=${billingCycle}` : `/signup?redirect=/checkout?plan=${plan.id}&billing=${billingCycle}`}
                  className={`block w-full py-3 rounded-full text-center font-bold text-sm transition-all ${
                    plan.highlighted
                      ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {userPlan === plan.id ? "התוכנית הנוכחית שלך" : plan.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Credit Slider */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">צריכים עוד קרדיטים?</h2>
            <p className="text-gray-500">גררו ובחרו כמה קרדיטים — ככל שקונים יותר, המחיר יורד</p>
          </div>
          <div className="rounded-2xl border-2 border-gray-200 p-8 bg-white">
            {/* Credits display */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-900">{sliderCredits}</div>
              <div className="text-sm text-gray-500 mt-1">קרדיטים</div>
            </div>

            {/* Slider */}
            <div className="relative mb-6 px-1">
              <input
                type="range"
                min={0}
                max={SLIDER_STEPS.length - 1}
                value={sliderIndex}
                onChange={(e) => setSliderIndex(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer slider-emerald"
                style={{
                  background: `linear-gradient(to left, #10b981 ${(sliderIndex / (SLIDER_STEPS.length - 1)) * 100}%, #e5e7eb ${(sliderIndex / (SLIDER_STEPS.length - 1)) * 100}%)`,
                }}
              />
              <div className="flex justify-between mt-2 px-0.5">
                <span className="text-[10px] text-gray-400">300</span>
                <span className="text-[10px] text-gray-400">10</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4 mb-6">
              <div>
                <div className="text-3xl font-bold text-gray-900">₪{getPrice(sliderCredits)}</div>
                <div className="text-xs text-gray-400 mt-0.5">תשלום חד פעמי</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-emerald-600">
                  ₪{(getPrice(sliderCredits) / sliderCredits).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">לקרדיט</div>
              </div>
            </div>

            {/* Savings indicator */}
            {sliderCredits >= 50 && (
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  חיסכון {Math.round((1 - getPrice(sliderCredits) / sliderCredits) * 100)}% לעומת מחיר בסיס
                </span>
              </div>
            )}

            <Link
              href={isLoggedIn ? `/checkout?credits=${sliderCredits}` : `/signup?redirect=/checkout?credits=${sliderCredits}`}
              className="block w-full py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-center font-bold text-sm transition-all shadow-lg"
            >
              רכוש {sliderCredits} קרדיטים
            </Link>
          </div>
        </div>
      </section>

      {/* Credit costs table */}
      <section className="px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">כמה עולה כל פעולה?</h2>
            <p className="text-gray-500">כל כלי צורך מספר קרדיטים בהתאם למורכבות</p>
          </div>
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            {CREDIT_COSTS.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  i < CREDIT_COSTS.length - 1 ? "border-b border-gray-200" : ""
                }`}
              >
                <span className="text-sm text-gray-700 font-medium">{item.action}</span>
                <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-full border border-gray-200">
                  {item.credits} קרדיטים
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise / Professionals */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12">
            {/* Subtle pattern */}
            <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
            
            <div className="relative flex flex-col md:flex-row items-center gap-8">
              {/* Text */}
              <div className="flex-1 text-center md:text-right">
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-4">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-emerald-300 font-medium">לאנשי מקצוע</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  מעצבי פנים? קבלנים? אדריכלים?
                </h2>
                <p className="text-gray-300 text-base leading-relaxed mb-4">
                  השתמשו ב-ShiputzAI כדי להציג ללקוחות שלכם הדמיות מרהיבות, ניתוח הצעות מחיר, וכתבי כמויות מקצועיים.
                </p>
                <ul className="space-y-2 mb-6 text-right">
                  {[
                    "קרדיטים בכמויות גדולות במחיר מוזל",
                    "שימוש מסחרי מלא",
                    "תמיכה מועדפת ואישית",
                    "הדרכה והטמעה",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <a
                    href="mailto:help@shipazti.com?subject=תוכנית לאנשי מקצוע"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    help@shipazti.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">שאלות נפוצות</h2>
          <div className="space-y-3">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-right"
                >
                  <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
