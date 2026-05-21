import { NextRequest } from 'next/server';
import { createServiceClient } from './supabase';

const SHAVUOT_COOKIE = 'shiputzai_gift_campaign';
const SHAVUOT_CAMPAIGN = 'shavuot_2026';
const SHAVUOT_CREDITS = 20;

export type GiftClaimResult =
  | { claimed: true; campaignKey: string; credits: number; balanceAfter: number }
  | { claimed: false; reason: string };

function hasShavuotGiftCookie(request: NextRequest): boolean {
  return request.cookies.get(SHAVUOT_COOKIE)?.value === SHAVUOT_CAMPAIGN;
}

export async function claimShavuotGiftAfterSuccessfulAction(
  request: NextRequest,
  email: string | null | undefined,
  triggerAction: string
): Promise<GiftClaimResult> {
  if (!email) return { claimed: false, reason: 'missing_email' };
  if (!hasShavuotGiftCookie(request)) return { claimed: false, reason: 'not_eligible' };

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('claim_credit_campaign_gift', {
      p_user_email: email.toLowerCase(),
      p_campaign_key: SHAVUOT_CAMPAIGN,
      p_credits: SHAVUOT_CREDITS,
      p_trigger_action: triggerAction,
    });

    if (error) {
      console.error('[gift-campaigns] Failed to claim Shavuot gift:', error);
      return { claimed: false, reason: 'claim_failed' };
    }

    if (data?.claimed === true) {
      return {
        claimed: true,
        campaignKey: data.campaignKey || SHAVUOT_CAMPAIGN,
        credits: data.credits || SHAVUOT_CREDITS,
        balanceAfter: data.balanceAfter || 0,
      };
    }

    return { claimed: false, reason: data?.reason || 'not_claimed' };
  } catch (error) {
    console.error('[gift-campaigns] Failed to claim Shavuot gift:', error);
    return { claimed: false, reason: 'claim_failed' };
  }
}
