// Send critical alerts via Telegram bot
// Used for payment failures, webhook errors, etc.

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_ALERT_CHAT_ID = process.env.TELEGRAM_ALERT_CHAT_ID || '5423049487'; // Guy's Telegram

export async function sendAlert(title: string, message: string) {
  if (!TELEGRAM_BOT_TOKEN) return; // Silent skip if not configured
  
  const text = `🚨 *${title}*\n\n${message}`;
  
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_ALERT_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });
  } catch {
    // Alert system itself should never crash the app
  }
}

export async function alertPaymentFailure(email: string, product: string, error: string) {
  await sendAlert(
    'תשלום נכשל',
    `Email: ${email}\nProduct: ${product}\nError: ${error}`
  );
}

export async function alertWebhookError(error: string, body?: string) {
  await sendAlert(
    'PayPlus Webhook Error',
    `Error: ${error}\n${body ? `Body: ${body.slice(0, 200)}` : ''}`
  );
}
