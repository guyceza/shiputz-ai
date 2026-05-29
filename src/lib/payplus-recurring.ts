import {
  getBillingCycleMonths,
  getNextChargeDate,
  getPlanRecurringAmount,
  PLAN_PRICING,
  toPayPlusDate,
  type BillingCycle,
  type PlanId,
} from './plan-pricing';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_TERMINAL_UID = process.env.PAYPLUS_TERMINAL_UID;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';
const WEBHOOK_SECRET = process.env.PAYPLUS_WEBHOOK_SECRET;

export type PayPlusRecurringItem = {
  name?: string;
  quantity?: number;
  price?: number;
  currency_code?: string;
  quantity_price?: number;
  amount_pay?: number;
  quantity_price_including_vat?: number;
  discount_type?: string | null;
  discount_amount?: number;
  discount_value?: number | null;
  [key: string]: unknown;
};

export type PayPlusRecurring = {
  uid?: string;
  customer_uid?: string;
  customer_email?: string;
  card_token?: string;
  cashier_uid?: string;
  currency_code?: string;
  number?: string;
  valid?: boolean;
  items?: PayPlusRecurringItem[];
  successful_invoice?: boolean;
  send_customer_success_email?: boolean;
  customer_failure_email?: boolean;
};

type PayPlusPayload = PayPlusRecurring & {
  status?: string;
  message?: string;
  description?: string;
  data?: PayPlusRecurring | PayPlusRecurring[];
  results?: {
    status?: string;
    description?: string;
  };
  raw?: string;
};

function ensurePayPlusConfigured() {
  if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY || !PAYPLUS_TERMINAL_UID) {
    throw new Error('PayPlus is not configured');
  }
}

export function isActiveRecurring(recurring: PayPlusRecurring | null | undefined) {
  return Boolean(recurring?.uid && recurring.valid !== false);
}

export function unwrapRecurring(payload: PayPlusPayload): PayPlusRecurring {
  if (payload.data && !Array.isArray(payload.data)) return payload.data;
  return payload;
}

export async function payPlusRequest(path: string, init: RequestInit = {}): Promise<PayPlusPayload> {
  ensurePayPlusConfigured();

  const response = await fetch(`${PAYPLUS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'api-key': PAYPLUS_API_KEY || '',
      'secret-key': PAYPLUS_SECRET_KEY || '',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let data: PayPlusPayload = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok || data?.status === 'error' || data?.results?.status === 'error') {
    const message = data?.message || data?.results?.description || data?.description || 'PayPlus request failed';
    throw new Error(message);
  }

  return data;
}

export async function viewPayPlusRecurring(recurringUid: string) {
  return unwrapRecurring(await payPlusRequest(
    `/RecurringPayments/${encodeURIComponent(recurringUid)}/ViewRecurring?terminal_uid=${encodeURIComponent(PAYPLUS_TERMINAL_UID || '')}`
  ));
}

export async function findRecurringForUser(
  email: string,
  storedRecurringUid?: string | null,
  storedCustomerUid?: string | null
) {
  if (storedRecurringUid) {
    const recurring = await viewPayPlusRecurring(storedRecurringUid);
    if (isActiveRecurring(recurring)) return recurring;
  }

  if (storedCustomerUid) {
    const list = await payPlusRequest(
      `/RecurringPayments/View?terminal_uid=${encodeURIComponent(PAYPLUS_TERMINAL_UID || '')}&customer_uid=${encodeURIComponent(storedCustomerUid)}&skip=0&take=20`
    );
    if (Array.isArray(list.data)) {
      const recurring = list.data.find((item) => isActiveRecurring(item));
      if (recurring) return recurring;
    }
  }

  const list = await payPlusRequest(
    `/RecurringPayments/View?terminal_uid=${encodeURIComponent(PAYPLUS_TERMINAL_UID || '')}&search=${encodeURIComponent(email)}&skip=0&take=20`
  );
  return Array.isArray(list.data)
    ? list.data.find((item) =>
      isActiveRecurring(item) && item.customer_email?.toLowerCase() === email.toLowerCase()
    ) || null
    : null;
}

export async function cancelPayPlusRecurring(recurringUid: string) {
  return payPlusRequest(`/RecurringPayments/DeleteRecurring/${encodeURIComponent(recurringUid)}`, {
    method: 'POST',
    body: JSON.stringify({ terminal_uid: PAYPLUS_TERMINAL_UID }),
  });
}

function buildRecurringItem(
  currentItem: PayPlusRecurringItem | null | undefined,
  planId: PlanId,
  billingCycle: BillingCycle
) {
  const plan = PLAN_PRICING[planId];
  const amount = getPlanRecurringAmount(planId, billingCycle);
  return {
    ...(currentItem || {}),
    name: `ShiputzAI ${plan.name} ${billingCycle}`,
    quantity: 1,
    price: amount,
    currency_code: 'ILS',
    quantity_price: amount,
    amount_pay: amount,
    quantity_price_including_vat: amount,
    discount_type: null,
    discount_amount: 0,
    discount_value: null,
  };
}

export async function updatePayPlusRecurringPlan(
  recurringUid: string,
  planId: PlanId,
  billingCycle: BillingCycle,
  options: {
    startDate?: Date;
    instantFirstPayment?: boolean;
  } = {}
) {
  const recurring = await viewPayPlusRecurring(recurringUid);

  if (!recurring.customer_uid || !recurring.card_token || !recurring.cashier_uid) {
    throw new Error('PayPlus recurring record is missing required billing fields');
  }

  const amount = getPlanRecurringAmount(planId, billingCycle);
  const startDate = options.startDate || getNextChargeDate(billingCycle);
  const updateBody = {
    terminal_uid: PAYPLUS_TERMINAL_UID,
    customer_uid: recurring.customer_uid,
    card_token: recurring.card_token,
    cashier_uid: recurring.cashier_uid,
    currency_code: recurring.currency_code || 'ILS',
    instant_first_payment: options.instantFirstPayment ?? false,
    recurring_type: 2,
    recurring_range: getBillingCycleMonths(billingCycle),
    number_of_charges: 0,
    start_date: toPayPlusDate(startDate),
    valid: true,
    items: [buildRecurringItem(recurring.items?.[0], planId, billingCycle)],
    successful_invoice: recurring.successful_invoice ?? true,
    send_customer_success_email: recurring.send_customer_success_email ?? true,
    customer_failure_email: recurring.customer_failure_email ?? true,
    send_failure_callback: true,
    ref_url_callback: `https://shipazti.com/api/payplus/webhook?secret=${WEBHOOK_SECRET || ''}`,
    extra_info: `plan_${planId}_${billingCycle}`,
  };

  await payPlusRequest(`/RecurringPayments/Update/${encodeURIComponent(recurringUid)}`, {
    method: 'POST',
    body: JSON.stringify(updateBody),
  });

  return { nextChargeDate: updateBody.start_date, amount };
}
