const PURCHASE_DISCORD_WEBHOOK_URL = process.env.DISCORD_PURCHASE_WEBHOOK_URL;

function formatDiscordField(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'לא ידוע';
  return String(value).slice(0, 300);
}

function formatDiscordMetric(icon: string, label: string, value: unknown): string {
  return `${icon} ${label}: ${formatDiscordField(value)}`;
}

function formatAmount(amount: unknown): string {
  const numeric = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(numeric) || numeric <= 0) return 'לא ידוע';
  return `₪${numeric.toLocaleString('he-IL')}`;
}

function getProductLabel(productType?: string | null): string {
  const labels: Record<string, string> = {
    pro: 'Pro חד פעמי',
    pro_monthly: 'Pro חודשי',
    pro_annual: 'Pro שנתי',
    premium: 'Premium',
    premium_plus: 'Premium Plus',
    vision: 'Vision',
    pack_10: '10 קרדיטים',
    pack_30: '30 קרדיטים',
    pack_100: '100 קרדיטים',
  };

  if (!productType) return 'לא ידוע';
  const planMatch = productType.match(/^plan_(starter|pro|business)_(monthly|annual)$/);
  if (planMatch) return `${planMatch[1]} ${planMatch[2] === 'monthly' ? 'חודשי' : 'שנתי'}`;
  const upgradeMatch = productType.match(/^upgrade_(starter|pro|business)_to_(starter|pro|business)_monthly$/);
  if (upgradeMatch) return `שדרוג ${upgradeMatch[1]} ל-${upgradeMatch[2]}`;
  const creditsMatch = productType.match(/^credits_(\d+)$/);
  if (creditsMatch) return `${creditsMatch[1]} קרדיטים`;
  return labels[productType] || productType;
}

export async function notifyDiscordPurchase(params: {
  email: string;
  productType?: string | null;
  amount?: string | number | null;
  source: 'payplus_webhook' | 'payplus_check';
  transactionUid?: string | null;
  pageRequestUid?: string | null;
  statusDescription?: string | null;
  supabase?: any;
}): Promise<void> {
  if (!PURCHASE_DISCORD_WEBHOOK_URL) return;

  let attribution: any = null;
  let userName: string | null = null;

  try {
    if (params.supabase) {
      if (params.pageRequestUid) {
        const { data } = await params.supabase
          .from('payment_attribution')
          .select('utm_source, utm_medium, utm_campaign, first_source, first_medium, first_landing_path, first_landing_page, first_referrer, gclid, fbclid, msclkid')
          .eq('page_request_uid', params.pageRequestUid)
          .maybeSingle();
        attribution = data || null;
      }

      const { data: user } = await params.supabase
        .from('users')
        .select('name')
        .eq('email', params.email.toLowerCase())
        .maybeSingle();
      userName = user?.name || null;
    }
  } catch (err) {
    console.warn('Discord purchase context lookup failed:', err);
  }

  const source = attribution?.utm_source || attribution?.first_source;
  const medium = attribution?.utm_medium || attribution?.first_medium;
  const campaign = attribution?.utm_campaign;
  const landingPath = attribution?.first_landing_path || attribution?.first_landing_page;
  const referrer = attribution?.first_referrer;
  const clickId = attribution?.gclid ? 'Google Ads' : attribution?.fbclid ? 'Meta Ads' : attribution?.msclkid ? 'Microsoft Ads' : null;
  const purchaseTime = new Date().toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const lines = [
    formatDiscordMetric('👤', 'Name', userName),
    formatDiscordMetric('✉️', 'Email', params.email),
    formatDiscordMetric('🛒', 'Product', getProductLabel(params.productType)),
    formatDiscordMetric('💰', 'Amount', formatAmount(params.amount)),
    '',
    formatDiscordMetric('📍', 'Source', [source, medium].filter(Boolean).join(' / ')),
    formatDiscordMetric('🎯', 'Campaign', campaign),
    formatDiscordMetric('🚪', 'Landing page', landingPath),
    formatDiscordMetric('🔗', 'Referrer', referrer),
    formatDiscordMetric('🖱️', 'Click platform', clickId),
    '',
    formatDiscordMetric('🧾', 'Transaction', params.transactionUid || params.pageRequestUid),
    formatDiscordMetric('⚙️', 'Handler', params.source),
    formatDiscordMetric('🕒', 'Purchase time', purchaseTime),
  ];

  if (params.statusDescription) {
    lines.push(formatDiscordMetric('✅', 'PayPlus status', params.statusDescription));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(PURCHASE_DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ShiputzAI',
        embeds: [{
          title: '💳 ShiputzAI Purchase',
          description: lines.join('\n'),
          color: 0x10B981,
          timestamp: new Date().toISOString(),
        }],
        allowed_mentions: { parse: [] },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('Discord purchase notification failed:', response.status, await response.text());
    }
  } catch (err) {
    console.warn('Discord purchase notification failed:', err);
  } finally {
    clearTimeout(timeout);
  }
}
