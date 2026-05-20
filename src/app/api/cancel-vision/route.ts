import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

const PAYPLUS_API_KEY = process.env.PAYPLUS_API_KEY;
const PAYPLUS_SECRET_KEY = process.env.PAYPLUS_SECRET_KEY;
const PAYPLUS_TERMINAL_UID = process.env.PAYPLUS_TERMINAL_UID;
const PAYPLUS_BASE_URL = process.env.PAYPLUS_BASE_URL || 'https://restapi.payplus.co.il/api/v1.0';

type PayPlusRecurring = {
  uid?: string;
  customer_uid?: string;
  customer_email?: string;
  number?: string;
  valid?: boolean;
};

type PayPlusPayload = PayPlusRecurring & {
  status?: string;
  message?: string;
  description?: string;
  results?: {
    status?: string;
    description?: string;
  };
  data?: PayPlusRecurring[];
  raw?: string;
};

function isActiveRecurring(recurring: PayPlusRecurring) {
  return Boolean(recurring?.uid && recurring.valid !== false);
}

async function payPlusRequest(path: string, init: RequestInit = {}): Promise<PayPlusPayload> {
  if (!PAYPLUS_API_KEY || !PAYPLUS_SECRET_KEY || !PAYPLUS_TERMINAL_UID) {
    throw new Error('PayPlus is not configured');
  }

  const response = await fetch(`${PAYPLUS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'api-key': PAYPLUS_API_KEY,
      'secret-key': PAYPLUS_SECRET_KEY,
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

async function findRecurringForUser(email: string, storedRecurringUid?: string | null, storedCustomerUid?: string | null) {
  if (storedRecurringUid) {
    const recurring = await payPlusRequest(
      `/RecurringPayments/${encodeURIComponent(storedRecurringUid)}/ViewRecurring?terminal_uid=${encodeURIComponent(PAYPLUS_TERMINAL_UID || '')}`
    ) as PayPlusRecurring;
    if (isActiveRecurring(recurring)) return recurring;
  }

  if (storedCustomerUid) {
    const list = await payPlusRequest(
      `/RecurringPayments/View?terminal_uid=${encodeURIComponent(PAYPLUS_TERMINAL_UID || '')}&customer_uid=${encodeURIComponent(storedCustomerUid)}&skip=0&take=20`
    );
    const recurring = list?.data?.find((item: PayPlusRecurring) => isActiveRecurring(item));
    if (recurring) return recurring;
  }

  // PayPlus search is less reliable than customer_uid, but it helps for older records.
  const list = await payPlusRequest(
    `/RecurringPayments/View?terminal_uid=${encodeURIComponent(PAYPLUS_TERMINAL_UID || '')}&search=${encodeURIComponent(email)}&skip=0&take=20`
  );
  return list?.data?.find((item: PayPlusRecurring) =>
    isActiveRecurring(item) && item.customer_email?.toLowerCase() === email.toLowerCase()
  ) || null;
}

async function cancelPayPlusRecurring(recurringUid: string) {
  return payPlusRequest(`/RecurringPayments/DeleteRecurring/${encodeURIComponent(recurringUid)}`, {
    method: 'POST',
    body: JSON.stringify({ terminal_uid: PAYPLUS_TERMINAL_UID }),
  });
}

// Note: Auth simplified - users can only cancel their own subscription via email

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const normalizedEmail = email.toLowerCase();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('payplus_recurring_uid, payplus_customer_uid, payplus_subscription_status')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recurring = await findRecurringForUser(
      normalizedEmail,
      user.payplus_recurring_uid,
      user.payplus_customer_uid
    );

    if (recurring?.uid) {
      await cancelPayPlusRecurring(recurring.uid);
    } else if (user.payplus_subscription_status === 'active') {
      return NextResponse.json({
        error: 'Could not find the active PayPlus subscription to cancel',
      }, { status: 502 });
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        purchased: false,
        plan: 'free',
        vision_subscription: 'canceled',
        vision_canceled_at: new Date().toISOString(),
        payplus_recurring_uid: recurring?.uid || user.payplus_recurring_uid || null,
        payplus_customer_uid: recurring?.customer_uid || user.payplus_customer_uid || null,
        payplus_recurring_number: recurring?.number || null,
        payplus_subscription_status: 'canceled',
        payplus_last_checked_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, canceledInPayPlus: Boolean(recurring?.uid) });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
