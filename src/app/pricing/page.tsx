"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/auth-fetch";
import { CREDIT_COSTS, CREDIT_PACK_STEPS, getCreditPackPrice } from "@/lib/credit-costs";
import {
  ANNUAL_DISCOUNT_PERCENT,
  getPlanChangeState,
  getPlanDisplayPrice,
  getPlanMonthlyEquivalent,
  PLAN_ORDER,
  PLAN_PRICING,
  type BillingCycle,
  type PlanId,
} from "@/lib/plan-pricing";

const PLANS = PLAN_ORDER.map((planId) => PLAN_PRICING[planId]);

function getPlanCta(planId: PlanId, planName: string, userPlan: string, userBillingCycle: BillingCycle | null, billingCycle: BillingCycle) {
  const changeState = getPlanChangeState({
    currentPlanId: userPlan,
    currentBillingCycle: userBillingCycle,
    targetPlanId: planId,
    targetBillingCycle: billingCycle,
  });

  if (changeState.current) return { label: "התוכנית הנוכחית שלך", disabled: true, note: "", action: "disabled" as const };
  if (changeState.reason === "downgrade") {
    if (billingCycle === "monthly" && userBillingCycle === "monthly") {
      return {
        label: `עבור ל-${planName}`,
        disabled: false,
        note: "המסלול והחיוב החודשי יתעדכנו אוטומטית.",
        action: "downgrade" as const,
      };
    }
    return {
      label: "שינוי דרך תמיכה",
      disabled: true,
      note: "שנמוך למסלול הזה דורש טיפול ידני כדי למנוע חיוב כפול.",
      action: "disabled" as const,
    };
  }
  if (changeState.reason === "scheduled_change") {
    return {
      label: billingCycle === "monthly" ? `עבור ל-${planName} חודשי` : `עבור ל-${planName}`,
      disabled: false,
      note: "השינוי יתוזמן לסוף התקופה השנתית שכבר שולמה.",
      action: "scheduled" as const,
    };
  }
  if (changeState.reason === "billing_cycle_change") {
    if (changeState.available) {
      return {
        label: billingCycle === "annual" ? "מעבר לשנתי" : "מעבר לחודשי",
        disabled: false,
        note: billingCycle === "annual" ? "החודשי יסתיים אחרי שהתשלום השנתי יאושר." : "",
        action: "checkout" as const,
      };
    }
    return {
      label: billingCycle === "annual" ? "מעבר לשנתי" : "מעבר לחודשי",
      disabled: true,
      note: "מעבר בין חודשי לשנתי נעשה דרך תמיכה כדי למנוע חיוב כפול.",
      action: "disabled" as const,
    };
  }
  if (!changeState.available) {
    return { label: "שינוי דרך תמיכה", disabled: true, note: "שינוי המסלול הזה נעשה דרך תמיכה.", action: "disabled" as const };
  }
  if (changeState.upgrade) return { label: `שדרג ל-${planName}`, disabled: false, note: "", action: "checkout" as const };
  return { label: "התחל עכשיו", disabled: false, note: "", action: "checkout" as const };
}

function getPlanHref(planId: PlanId, billingCycle: BillingCycle, isLoggedIn: boolean) {
  const checkoutPath = `/checkout?plan=${planId}&billing=${billingCycle}`;
  return isLoggedIn
    ? checkoutPath
    : `/signup?redirect=${encodeURIComponent(checkoutPath)}`;
}

const SLIDER_STEPS = [...CREDIT_PACK_STEPS];

const FAQ = [
  {
    q: "מה זה קרדיטים?",
    a: `קרדיטים הם המטבע הפנימי של ShiputzAI. כל פעולה צורכת מספר קרדיטים בהתאם למורכבות שלה. למשל, הדמיית חדר עולה ${CREDIT_COSTS.visualize} קרדיטים, כתב כמויות עולה ${CREDIT_COSTS["bill-of-quantities"]}, וסרטון סיור עולה ${CREDIT_COSTS["video-walkthrough"]}.`,
  },
  {
    q: "האם הקרדיטים מצטברים?",
    a: "קרדיטים של מנוי מתאפסים ומתחדשים כל חודש לפי התוכנית. מנויים פעילים יכולים לקנות קרדיטים נוספים בתשלום חד-פעמי, והקרדיטים הנוספים לא מתאפסים.",
  },
  {
    q: "אפשר לנסות בחינם?",
    a: "בהחלט. כל משתמש חדש מקבל 10 קרדיטים בחינם כדי להכיר את המערכת. הכלים הכבדים מיועדים למנוי פעיל.",
  },
  {
    q: "איך משדרגים או מבטלים?",
    a: "אפשר לבטל בכל רגע. בשדרוג חודשי משלמים רק את ההפרש בין המסלול הקיים למסלול החדש עבור החודש הנוכחי, ומהחודש הבא החיוב מתעדכן למסלול החדש.",
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sliderIndex, setSliderIndex] = useState(1); // default to 50 credits
  const sliderCredits = SLIDER_STEPS[sliderIndex];
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [userBillingCycle, setUserBillingCycle] = useState<BillingCycle | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [changingPlanId, setChangingPlanId] = useState<PlanId | null>(null);
  const [planChangeMessage, setPlanChangeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const canBuyExtraCredits = Boolean(isLoggedIn && PLAN_PRICING[userPlan as PlanId]);

  const handlePlanChange = async (
    planId: PlanId,
    planName: string,
    targetBillingCycle: BillingCycle,
    mode: "downgrade" | "scheduled"
  ) => {
    if (!userEmail || changingPlanId) return;

    const confirmed = window.confirm(mode === "scheduled"
      ? `לתזמן מעבר ל-${planName} ${targetBillingCycle === "monthly" ? "חודשי" : "שנתי"} בסוף התקופה השנתית הנוכחית?`
      : `לעבור ל-${planName}? המסלול יתעדכן עכשיו והחיוב החודשי הבא יעודכן בפייפלוס.`
    );
    if (!confirmed) return;

    setChangingPlanId(planId);
    setPlanChangeMessage(null);

    try {
      const response = await authFetch("/api/subscription/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          targetPlanId: planId,
          targetBillingCycle,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "לא ניתן לעדכן את המסלול כרגע.");
      }

      setUserPlan(data.plan || planId);
      setUserBillingCycle(data.billingCycle || targetBillingCycle);
      setUserCredits(data.credits ?? userCredits);
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (storedUser.id) {
          localStorage.setItem("user", JSON.stringify({
            ...storedUser,
            plan: data.plan || planId,
            plan_billing_cycle: data.billingCycle || targetBillingCycle,
            viz_credits: data.credits ?? storedUser.viz_credits,
          }));
        }
      } catch {}

      setPlanChangeMessage({
        type: "success",
        text: data.scheduled
          ? `השינוי תוזמן. בתאריך ${new Date(data.scheduledChangeAt).toLocaleDateString("he-IL")} המסלול יעבור ל-${planName} ${targetBillingCycle === "monthly" ? "חודשי" : "שנתי"}.`
          : `המסלול עודכן ל-${planName}. החיוב הבא יהיה ₪${data.recurringNextAmount}/חודש.`,
      });
    } catch (error: unknown) {
      setPlanChangeMessage({
        type: "error",
        text: error instanceof Error ? error.message : "לא ניתן לעדכן את המסלול כרגע.",
      });
    } finally {
      setChangingPlanId(null);
    }
  };

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id) {
          queueMicrotask(() => {
            setIsLoggedIn(true);
            if (typeof user.email === "string") {
              setUserEmail(user.email);
            }
            if (typeof user.plan === "string") {
              setUserPlan(user.plan || "free");
            }
            if (user.plan_billing_cycle === "monthly" || user.plan_billing_cycle === "annual") {
              setUserBillingCycle(user.plan_billing_cycle);
            }
          });
          if (user.email) {
            setUserEmail(user.email);
            authFetch(`/api/credits?email=${encodeURIComponent(user.email)}`)
              .then(r => r.json())
              .then(d => {
                setUserCredits(d.credits);
                setUserPlan(d.plan || "free");
                setUserBillingCycle(d.billingCycle || null);
                try {
                  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
                  if (storedUser.id) {
                    localStorage.setItem("user", JSON.stringify({
                      ...storedUser,
                      plan: d.plan || "free",
                      plan_billing_cycle: d.billingCycle || null,
                      viz_credits: d.credits ?? storedUser.viz_credits,
                    }));
                  }
                } catch {}
              })
              .catch(() => {})
              .finally(() => {
                setPlanReady(true);
                setAuthReady(true);
              });
            return;
          }
          queueMicrotask(() => {
            setPlanReady(true);
            setAuthReady(true);
          });
          return;
        }
      }
    } catch {
      queueMicrotask(() => {
        setIsLoggedIn(false);
        setUserPlan("free");
        setUserBillingCycle(null);
      });
    }
    queueMicrotask(() => {
      setPlanReady(true);
      setAuthReady(true);
    });
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
            בחרו מנוי חודשי או שנתי, ואם צריך הוסיפו קרדיטים מעבר למסלול
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
                {ANNUAL_DISCOUNT_PERCENT}% הנחה
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="px-4 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const price = getPlanDisplayPrice(plan.id, billingCycle);
            const monthlyEquivalent = getPlanMonthlyEquivalent(plan.id, billingCycle);
            const perCredit = (monthlyEquivalent / plan.credits).toFixed(2);
            const isPlanCtaReady = authReady && (!isLoggedIn || planReady);
            const cta = getPlanCta(plan.id, plan.name, userPlan, userBillingCycle, billingCycle);
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
                      ₪{plan.annualTotalPrice} לשנה
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-emerald-600">{plan.credits} קרדיטים</span>
                    <span className="text-xs text-gray-400">(₪{perCredit} לקרדיט)</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                    * קרדיטים של מנוי מתאפסים ומתחדשים בכל חודש. קרדיטים שנרכשו בנפרד לא מתאפסים.
                  </p>
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

                {!isPlanCtaReady ? (
                  <button
                    type="button"
                    disabled
                    className="block w-full py-3 rounded-full text-center font-bold text-sm bg-gray-100 text-gray-400 cursor-wait"
                  >
                    בודק תוכנית...
                  </button>
                ) : cta.disabled ? (
                  <button
                    type="button"
                    disabled
                    className="block w-full py-3 rounded-full text-center font-bold text-sm bg-gray-200 text-gray-500 cursor-not-allowed"
                  >
                    {cta.label}
                  </button>
                ) : cta.action === "downgrade" || cta.action === "scheduled" ? (
                  <button
                    type="button"
                    onClick={() => handlePlanChange(
                      plan.id,
                      plan.name,
                      billingCycle,
                      cta.action === "scheduled" ? "scheduled" : "downgrade"
                    )}
                    disabled={changingPlanId === plan.id}
                    className={`block w-full py-3 rounded-full text-center font-bold text-sm transition-all disabled:cursor-wait disabled:opacity-60 ${
                      plan.highlighted
                        ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {changingPlanId === plan.id ? "מעדכן..." : cta.label}
                  </button>
                ) : (
                  <Link
                    href={getPlanHref(plan.id, billingCycle, isLoggedIn)}
                    className={`block w-full py-3 rounded-full text-center font-bold text-sm transition-all ${
                      plan.highlighted
                        ? "bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                    }`}
                  >
                    {cta.label}
                  </Link>
                )}
                {isPlanCtaReady && cta.note && (
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400">
                    {cta.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
        {planChangeMessage && (
          <div className={`max-w-xl mx-auto mt-5 rounded-2xl border px-4 py-3 text-center text-sm ${
            planChangeMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}>
            {planChangeMessage.text}
          </div>
        )}
      </section>

      {/* Credit Slider */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">צריכים עוד קרדיטים?</h2>
            <p className="text-gray-500">קרדיטים נוספים זמינים למנויים פעילים בלבד ונשארים בחשבון</p>
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
                <div className="text-3xl font-bold text-gray-900">₪{getCreditPackPrice(sliderCredits)}</div>
                <div className="text-xs text-gray-400 mt-0.5">תשלום חד פעמי</div>
              </div>
              <div className="text-left">
                <div className="text-lg font-bold text-emerald-600">
                  ₪{(getCreditPackPrice(sliderCredits) / sliderCredits).toFixed(2)}
                </div>
                <div className="text-xs text-gray-400">לקרדיט</div>
              </div>
            </div>

            {canBuyExtraCredits && (
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  תוספת חד-פעמית למנוי הפעיל שלך
                </span>
              </div>
            )}

            <Link
              href={canBuyExtraCredits ? `/checkout?credits=${sliderCredits}` : "#plans"}
              className={`block w-full py-3.5 rounded-full text-center font-bold text-sm transition-all shadow-lg ${
                canBuyExtraCredits
                  ? "bg-gray-900 hover:bg-gray-800 text-white"
                  : "bg-[#e0d5d5] hover:bg-[#d6caca] text-gray-900"
              }`}
            >
              {canBuyExtraCredits ? `רכוש ${sliderCredits} קרדיטים` : "בחרו מנוי כדי לפתוח רכישת קרדיטים"}
            </Link>
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
