"use client";

import Link from "next/link";

const plans = [
  {
    id: "free",
    name: "חינם",
    subtitle: "לטעימה ראשונה",
    price: "0",
    period: "",
    credits: "10 קרדיטים",
    features: [
      "הדמיית חדר אחת",
      "טיפים ומאמרים",
      "הזנת הוצאות ידנית",
    ],
    cta: "התחל בחינם",
    href: "/signup",
    highlighted: false,
  },
  {
    id: "starter",
    name: "Starter",
    subtitle: "לפרויקט קטן",
    price: "29",
    period: "/חודש",
    credits: "50 קרדיטים לחודש",
    features: [
      "הדמיות AI לחדרים",
      "כתב כמויות אוטומטי",
      "החלפת רהיטים",
      "Shop the Look",
      "סריקת קבלות",
    ],
    cta: "התחל עכשיו",
    href: "/pricing",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "הכי פופולרי",
    price: "79",
    period: "/חודש",
    credits: "200 קרדיטים לחודש",
    badge: "הכי פופולרי",
    features: [
      "כל הכלים כולל סרטון סיור",
      "הדמיית תוכנית קומה",
      "קניית קרדיטים נוספים",
      "שימוש מסחרי",
      "ניתוח הצעות מחיר",
    ],
    cta: "התחל עכשיו",
    href: "/pricing",
    highlighted: true,
  },
];

export default function PricingComparison() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full px-4 lg:px-8 justify-center items-center lg:items-stretch">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`rounded-2xl p-6 lg:p-10 bg-white flex flex-col w-full lg:flex-1 lg:max-w-[340px] relative ${
            plan.highlighted
              ? "border-2 border-gray-900 order-1 lg:order-2"
              : "border border-gray-200 order-2 lg:order-1"
          }`}
          dir="rtl"
        >
          {plan.badge && (
            <div className="absolute -top-3 right-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
              {plan.badge}
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
            <p className="text-gray-500 text-sm">{plan.subtitle}</p>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">₪{plan.price}</span>
              {plan.period && (
                <span className="text-gray-500 text-sm">{plan.period}</span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">{plan.credits}</p>
          </div>

          <ul className="space-y-3 mb-8 flex-grow">
            {plan.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-0 text-gray-900">
                <span className="flex-shrink-0 ml-0.5">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Link
            href={plan.href}
            className={`block w-full py-3 rounded-lg text-center font-medium transition-colors mt-auto ${
              plan.highlighted
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "border-2 border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {plan.cta}
          </Link>
        </div>
      ))}


      {/* Enterprise Card */}
      <div className="w-full lg:max-w-4xl order-3 mt-4 lg:mt-8" dir="rtl">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-10">
          <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px'}} />
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-right">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300 font-medium">Enterprise</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                מעצבי פנים? קבלנים? אדריכלים?
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                קרדיטים בכמויות גדולות במחיר מוזל · שימוש מסחרי מלא · תמיכה מועדפת · הדרכה והטמעה
              </p>
              <a
                href="mailto:help@shipazti.com?subject=תוכנית לאנשי מקצוע"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                help@shipazti.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
