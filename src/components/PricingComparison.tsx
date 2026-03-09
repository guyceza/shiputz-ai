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
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "לאנשי מקצוע",
    price: null,
    period: "",
    credits: "חבילה מותאמת אישית",
    features: [
      "קרדיטים בכמויות גדולות",
      "מחיר מוזל לקרדיט",
      "שימוש מסחרי מלא",
      "תמיכה מועדפת",
      "הדרכה והטמעה",
    ],
    cta: "help@shipazti.com",
    href: "mailto:help@shipazti.com?subject=תוכנית לאנשי מקצוע",
    highlighted: false,
    isEnterprise: true,
  },
];

export default function PricingComparison() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-4 lg:px-8">
      {plans.map((plan) => {
        const isEnterprise = (plan as any).isEnterprise;
        return (
          <div
            key={plan.id}
            className={`rounded-2xl p-6 lg:p-8 flex flex-col w-full relative ${
              plan.highlighted
                ? "border-2 border-gray-900 bg-white"
                : isEnterprise
                ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gray-700"
                : "border border-gray-200 bg-white"
            }`}
            dir="rtl"
          >
            {plan.badge && (
              <div className="absolute -top-3 right-6 bg-gray-900 text-white text-xs font-bold px-4 py-1 rounded-full">
                {plan.badge}
              </div>
            )}

            <div className="mb-4">
              <h3 className={`text-xl font-bold mb-1 ${isEnterprise ? "text-white" : "text-gray-900"}`}>
                {plan.name}
              </h3>
              <p className={`text-sm ${isEnterprise ? "text-emerald-300" : "text-gray-500"}`}>
                {plan.subtitle}
              </p>
            </div>

            <div className="mb-4">
              {plan.price !== null ? (
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold text-gray-900">₪{plan.price}</span>
                  {plan.period && (
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  )}
                </div>
              ) : (
                <div className="flex items-baseline justify-center gap-1">
                  <span className={`text-2xl font-bold ${isEnterprise ? "text-white" : "text-gray-900"}`}>בואו נדבר</span>
                </div>
              )}
              <p className={`text-sm mt-1 ${isEnterprise ? "text-gray-400" : "text-gray-500"}`}>
                {plan.credits}
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-grow">
              {plan.features.map((feature, i) => (
                <li key={i} className={`flex items-start gap-0 ${isEnterprise ? "text-gray-300" : "text-gray-900"}`}>
                  <span className={`flex-shrink-0 ml-0.5 ${isEnterprise ? "text-emerald-400" : ""}`}>✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {isEnterprise ? (
              <a
                href={plan.href}
                className="block w-full py-3 rounded-lg text-center font-medium transition-colors mt-auto bg-emerald-500 hover:bg-emerald-400 text-white"
              >
                {plan.cta}
              </a>
            ) : (
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
            )}
          </div>
        );
      })}
    </div>
  );
}
