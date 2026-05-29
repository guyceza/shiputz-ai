'use client';

export type AttributionPayload = {
  first_source?: string | null;
  first_medium?: string | null;
  first_referrer?: string | null;
  first_landing_page?: string | null;
  first_landing_path?: string | null;
  first_query?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  msclkid?: string | null;
  user_agent?: string | null;
  captured_at?: string | null;
};

const STORAGE_KEY = 'shiputzai_attribution';

function safeValue(value: string | null | undefined, maxLength = 500): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function inferSource(referrer: string | null, params: URLSearchParams): { source: string; medium: string } {
  const utmSource = safeValue(params.get('utm_source'), 120);
  const utmMedium = safeValue(params.get('utm_medium'), 120);
  if (utmSource) {
    return { source: utmSource, medium: utmMedium || 'utm' };
  }

  if (params.get('gclid')) return { source: 'google', medium: 'cpc' };
  if (params.get('fbclid')) return { source: 'facebook', medium: 'social' };
  if (params.get('msclkid')) return { source: 'microsoft', medium: 'cpc' };

  if (!referrer) return { source: 'direct', medium: 'none' };

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('google.')) return { source: 'google', medium: 'organic' };
    if (host.includes('bing.')) return { source: 'bing', medium: 'organic' };
    if (host.includes('facebook.') || host.includes('instagram.')) return { source: host, medium: 'social' };
    if (host.includes('payplus.co.il')) return { source: 'payments.payplus.co.il', medium: 'referral' };
    return { source: host, medium: 'referral' };
  } catch {
    return { source: 'referral', medium: 'referral' };
  }
}

function hasPaidOrCampaignSignal(attribution: AttributionPayload | null | undefined) {
  return Boolean(
    attribution?.gclid ||
      attribution?.fbclid ||
      attribution?.msclkid ||
      attribution?.utm_source ||
      attribution?.utm_campaign
  );
}

function hasPaidOrCampaignParams(params: URLSearchParams) {
  return Boolean(
    params.get('gclid') ||
      params.get('fbclid') ||
      params.get('msclkid') ||
      params.get('utm_source') ||
      params.get('utm_campaign')
  );
}

export function captureAttribution(): AttributionPayload | null {
  if (typeof window === 'undefined') return null;

  const url = new URL(window.location.href);
  const existing = getStoredAttribution();
  const currentHasCampaign = hasPaidOrCampaignParams(url.searchParams);

  if (existing?.captured_at) {
    // Preserve first touch, except when the old value is direct/referral noise
    // and the current visit carries an explicit paid/campaign signal.
    if (!currentHasCampaign || hasPaidOrCampaignSignal(existing)) return existing;
  }

  const referrer = safeValue(document.referrer, 1000);
  const { source, medium } = inferSource(referrer, url.searchParams);

  const attribution: AttributionPayload = {
    first_source: source,
    first_medium: medium,
    first_referrer: referrer,
    first_landing_page: safeValue(url.href, 1000),
    first_landing_path: safeValue(`${url.pathname}${url.search}`, 1000),
    first_query: safeValue(url.search.replace(/^\?/, ''), 1000),
    utm_source: safeValue(url.searchParams.get('utm_source'), 120),
    utm_medium: safeValue(url.searchParams.get('utm_medium'), 120),
    utm_campaign: safeValue(url.searchParams.get('utm_campaign'), 200),
    utm_term: safeValue(url.searchParams.get('utm_term'), 200),
    utm_content: safeValue(url.searchParams.get('utm_content'), 200),
    gclid: safeValue(url.searchParams.get('gclid'), 300),
    fbclid: safeValue(url.searchParams.get('fbclid'), 300),
    msclkid: safeValue(url.searchParams.get('msclkid'), 300),
    user_agent: safeValue(navigator.userAgent, 500),
    captured_at: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  return attribution;
}

export function getStoredAttribution(): AttributionPayload | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
