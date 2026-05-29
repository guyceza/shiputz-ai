"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ANNUAL_DISCOUNT_PERCENT,
  getPlanDisplayPrice,
  getPlanMonthlyEquivalent,
  PLAN_ORDER,
  PLAN_PRICING,
  type BillingCycle,
  type PlanId,
} from "@/lib/plan-pricing";

type PricingComparisonProps = {
  isLoggedIn?: boolean;
};

function getPlanHref(planId: PlanId, billingCycle: BillingCycle, isLoggedIn: boolean) {
  const checkoutPath = `/checkout?plan=${planId}&billing=${billingCycle}`;
  return isLoggedIn ? checkoutPath : `/signup?redirect=${encodeURIComponent(checkoutPath)}`;
}

export default function PricingComparison({ isLoggedIn = false }: PricingComparisonProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  return (
    <div className="w-full">
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
              billingCycle === "monthly"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            חודשי
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("annual")}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
              billingCycle === "annual"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            שנתי
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
              {ANNUAL_DISCOUNT_PERCENT}% הנחה
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
        {PLAN_ORDER.map((planId) => {
          const plan = PLAN_PRICING[planId];
          const price = getPlanDisplayPrice(planId, billingCycle);
          const monthlyEquivalent = getPlanMonthlyEquivalent(planId, billingCycle);
          const perCredit = (monthlyEquivalent / plan.credits).toFixed(2);

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 text-right transition-all ${
                plan.highlighted
                  ? "scale-[1.02] border-gray-900 bg-white shadow-xl"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              dir="rtl"
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gray-900 px-4 py-1 text-xs font-bold text-white">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 flex items-baseline justify-start gap-2">
                  {billingCycle === "annual" && (
                    <span className="text-lg text-gray-400 line-through">₪{plan.monthlyPrice}</span>
                  )}
                  <span className="text-4xl font-bold text-gray-900">₪{price}</span>
                  <span className="text-sm text-gray-400">/לחודש</span>
                </div>
                {billingCycle === "annual" && (
                  <div className="mt-1 text-xs text-gray-400">
                    ₪{plan.annualTotalPrice} לשנה
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-600">{plan.credits} קרדיטים</span>
                  <span className="text-xs text-gray-400">(₪{perCredit} לקרדיט)</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                  * קרדיטים של מנוי מתאפסים ומתחדשים בכל חודש. קרדיטים שנרכשו בנפרד לא מתאפסים.
                </p>
              </div>

              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={getPlanHref(plan.id, billingCycle, isLoggedIn)}
                className={`block w-full rounded-full py-3 text-center text-sm font-bold transition-all ${
                  plan.highlighted
                    ? "bg-gray-900 text-white shadow-lg hover:bg-gray-800"
                    : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                }`}
              >
                התחל עכשיו
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
