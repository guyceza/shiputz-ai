import { NextResponse } from 'next/server';
import { canPerformAction, deductCredits, CreditAction } from './credits';

/**
 * Check + deduct credits for an API action.
 * Call at the START of your API route.
 * Returns null if OK (credits deducted), or a NextResponse error to return.
 */
export async function creditGuard(
  email: string | null | undefined,
  action: CreditAction
): Promise<{ error: NextResponse } | { ok: true; cost: number; balance: number }> {
  // No email = guest, skip credit check (guest has own limits)
  if (!email) {
    return { ok: true, cost: 0, balance: 0 };
  }

  try {
    const check = await canPerformAction(email, action);
    
    if (check.isAdmin) {
      return { ok: true, cost: 0, balance: 999 };
    }

    if (!check.allowed) {
      return {
        error: NextResponse.json(
          { 
            error: 'אין מספיק קרדיטים', 
            creditError: true,
            required: check.cost, 
            balance: check.balance 
          },
          { status: 402 }
        ),
      };
    }

    const result = await deductCredits(email, action);
    return { ok: true, cost: result.cost, balance: result.newBalance };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { error: err.message || 'Credit check failed', creditError: true },
        { status: 402 }
      ),
    };
  }
}
