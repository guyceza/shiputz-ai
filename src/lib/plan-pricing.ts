export type PlanId = "starter" | "pro" | "business";
export type BillingCycle = "monthly" | "annual";
export type PlanChangeReason = "current" | "downgrade" | "billing_cycle_change" | "scheduled_change" | "unsupported";

export type PlanChangeState = {
  available: boolean;
  current: boolean;
  upgrade: boolean;
  reason?: PlanChangeReason;
};

export const ANNUAL_DISCOUNT_PERCENT = 25;

export const PLAN_RANK: Record<"free" | PlanId, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  business: 3,
};

export const PLAN_ORDER: PlanId[] = ["starter", "pro", "business"];

export const PLAN_PRICING: Record<PlanId, {
  id: PlanId;
  name: string;
  subtitle: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  annualTotalPrice: number;
  credits: number;
  badge?: string;
  highlighted: boolean;
  features: string[];
}> = {
  starter: {
    id: "starter",
    name: "Starter",
    subtitle: "לפרויקט קטן",
    monthlyPrice: 29,
    annualMonthlyPrice: 22,
    annualTotalPrice: 261,
    credits: 50,
    highlighted: false,
    features: [
      "50 קרדיטים לחודש",
      "הדמיות AI לחדרים",
      "כתב כמויות אוטומטי",
      "החלפת רהיטים",
      "Shop the Look",
      "סריקת קבלות",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    subtitle: "הכי פופולרי",
    monthlyPrice: 79,
    annualMonthlyPrice: 59,
    annualTotalPrice: 711,
    credits: 200,
    badge: "הכי פופולרי",
    highlighted: true,
    features: [
      "200 קרדיטים לחודש",
      "כל הכלים כולל סרטון סיור",
      "הדמיית תוכנית קומה",
      "קניית קרדיטים נוספים",
      "שימוש מסחרי",
      "ניתוח הצעות מחיר",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    subtitle: "לצוותים וקבלנים",
    monthlyPrice: 199,
    annualMonthlyPrice: 149,
    annualTotalPrice: 1791,
    credits: 600,
    highlighted: false,
    features: [
      "600 קרדיטים לחודש",
      "כל הכלים פתוחים",
      "עוזר AI ללא הגבלת קרדיטים",
      "קניית קרדיטים נוספים",
      "שימוש מסחרי",
      "תמיכה עדיפה",
    ],
  },
};

export function getPlanDisplayPrice(planId: PlanId, billingCycle: BillingCycle): number {
  const plan = PLAN_PRICING[planId];
  return billingCycle === "annual" ? plan.annualMonthlyPrice : plan.monthlyPrice;
}

export function getPlanCheckoutAmount(planId: PlanId, billingCycle: BillingCycle): number {
  const plan = PLAN_PRICING[planId];
  return billingCycle === "annual" ? plan.annualTotalPrice : plan.monthlyPrice;
}

export function getPlanMonthlyEquivalent(planId: PlanId, billingCycle: BillingCycle): number {
  const plan = PLAN_PRICING[planId];
  return billingCycle === "annual" ? plan.annualTotalPrice / 12 : plan.monthlyPrice;
}

export function getPlanRecurringAmount(planId: PlanId, billingCycle: BillingCycle): number {
  const plan = PLAN_PRICING[planId];
  return billingCycle === "annual" ? plan.annualTotalPrice : plan.monthlyPrice;
}

export function getBillingCycleMonths(billingCycle: BillingCycle): number {
  return billingCycle === "annual" ? 12 : 1;
}

export function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export function getBillingPeriodEnd(start: Date, billingCycle: BillingCycle): Date {
  return addMonthsClamped(start, getBillingCycleMonths(billingCycle));
}

export function toPayPlusDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getNextChargeDate(billingCycle: BillingCycle, from = new Date()): Date {
  const next = getBillingPeriodEnd(from, billingCycle);
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  if (next < tomorrow) {
    return tomorrow;
  }

  return next;
}

export function inferPlanBillingCycle(input: {
  plan?: string | null;
  planBillingCycle?: string | null;
  visionSubscription?: string | boolean | null;
  payplusSubscriptionStatus?: string | null;
  payplusRecurringUid?: string | null;
}): BillingCycle | null {
  if (!input.plan || input.plan === "free") return null;
  const hasActivePlan = input.visionSubscription === "active" || input.visionSubscription === true;
  if (!hasActivePlan) return null;
  if (input.planBillingCycle === "monthly" || input.planBillingCycle === "annual") {
    return input.planBillingCycle;
  }
  if (input.payplusSubscriptionStatus === "active" || Boolean(input.payplusRecurringUid)) return "monthly";
  return null;
}

export function getPlanChangeState(input: {
  currentPlanId?: string | null;
  currentBillingCycle?: BillingCycle | null;
  targetPlanId: PlanId;
  targetBillingCycle: BillingCycle;
}): PlanChangeState {
  const currentPlanId = input.currentPlanId || "free";
  if (currentPlanId === "free") {
    return { available: true, current: false, upgrade: false };
  }

  const currentRank = PLAN_RANK[currentPlanId as keyof typeof PLAN_RANK] || 0;
  const targetRank = PLAN_RANK[input.targetPlanId] || 0;
  const samePlan = currentPlanId === input.targetPlanId;
  const sameBilling = input.currentBillingCycle === input.targetBillingCycle;

  if (samePlan && sameBilling) {
    return { available: false, current: true, upgrade: false, reason: "current" };
  }

  if (!input.currentBillingCycle) {
    return { available: false, current: false, upgrade: false, reason: "billing_cycle_change" };
  }

  if (samePlan && !sameBilling) {
    if (input.currentBillingCycle === "monthly" && input.targetBillingCycle === "annual") {
      return { available: true, current: false, upgrade: false, reason: "billing_cycle_change" };
    }
    if (input.currentBillingCycle === "annual" && input.targetBillingCycle === "monthly") {
      return { available: false, current: false, upgrade: false, reason: "scheduled_change" };
    }
    return { available: false, current: false, upgrade: false, reason: "billing_cycle_change" };
  }

  if (input.currentBillingCycle === "annual" && input.targetBillingCycle === "monthly") {
    return { available: false, current: false, upgrade: false, reason: "scheduled_change" };
  }

  if (input.currentBillingCycle === "monthly" && input.targetBillingCycle === "annual") {
    return { available: true, current: false, upgrade: false, reason: "billing_cycle_change" };
  }

  if (targetRank < currentRank) {
    if (input.currentBillingCycle === "annual" && input.targetBillingCycle === "annual") {
      return { available: false, current: false, upgrade: false, reason: "scheduled_change" };
    }
    return { available: false, current: false, upgrade: false, reason: "downgrade" };
  }

  if (targetRank === currentRank) {
    return { available: false, current: false, upgrade: false, reason: "unsupported" };
  }

  if (input.currentBillingCycle !== "monthly" || input.targetBillingCycle !== "monthly") {
    if (input.currentBillingCycle === "annual" && input.targetBillingCycle === "annual") {
      return { available: true, current: false, upgrade: true };
    }
    return { available: false, current: false, upgrade: false, reason: "billing_cycle_change" };
  }

  return { available: true, current: false, upgrade: true };
}
