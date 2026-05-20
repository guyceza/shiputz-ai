import { addCredits } from "./credits";

export async function refundCreditCharge(
  email: string | null | undefined,
  cost: number,
  reason: string
) {
  if (!email || cost <= 0) return;

  try {
    await addCredits(email, cost, `refund_${reason}`);
  } catch (error) {
    console.error(`[credits] Failed to refund ${cost} credits for ${reason}:`, error);
  }
}
