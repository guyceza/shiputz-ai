export type ServerAttributionPayload = {
  first_source?: unknown;
  first_medium?: unknown;
  first_referrer?: unknown;
  first_landing_page?: unknown;
  first_landing_path?: unknown;
  first_query?: unknown;
  utm_source?: unknown;
  utm_medium?: unknown;
  utm_campaign?: unknown;
  utm_term?: unknown;
  utm_content?: unknown;
  gclid?: unknown;
  fbclid?: unknown;
  msclkid?: unknown;
  user_agent?: unknown;
  captured_at?: unknown;
};

const FIELD_LIMITS: Record<string, number> = {
  first_referrer: 1000,
  first_landing_page: 1000,
  first_landing_path: 1000,
  first_query: 1000,
  user_agent: 500,
  gclid: 300,
  fbclid: 300,
  msclkid: 300,
  utm_campaign: 200,
  utm_term: 200,
  utm_content: 200,
};

function cleanString(value: unknown, fallbackMax = 120): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, fallbackMax);
}

export function sanitizeAttribution(input: unknown): Record<string, string | null> | null {
  if (!input || typeof input !== 'object') return null;
  const payload = input as ServerAttributionPayload;

  const fields = [
    'first_source',
    'first_medium',
    'first_referrer',
    'first_landing_page',
    'first_landing_path',
    'first_query',
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
    'msclkid',
    'user_agent',
    'captured_at',
  ] as const;

  const clean: Record<string, string | null> = {};
  for (const field of fields) {
    clean[field] = cleanString(payload[field], FIELD_LIMITS[field] || 120);
  }

  const hasUsefulValue = fields.some((field) => field !== 'captured_at' && clean[field]);
  return hasUsefulValue ? clean : null;
}

export function getRequestIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || null;
}
