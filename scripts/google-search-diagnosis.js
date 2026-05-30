#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v24';
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SEARCH_CAMPAIGN_ID = (process.env.SHIPUTZAI_SEARCH_CAMPAIGN_ID || '23869539585').replace(/-/g, '');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    const shouldOverrideStaleGoogleAdsEnv =
      key.startsWith('GOOGLE_ADS_') && filePath === path.join(process.env.HOME || '/home/ubuntu', '.env');
    if (process.env[key] !== undefined && !shouldOverrideStaleGoogleAdsEnv) continue;

    let value = rawValue.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function loadEnv() {
  loadEnvFile(path.join(PROJECT_ROOT, '.env'));
  loadEnvFile(path.join(PROJECT_ROOT, '.env.local'));
  loadEnvFile(path.join(process.env.HOME || '/home/ubuntu', '.env'));
}

function normalizeCustomerId(value) {
  return (value || '').replace(/-/g, '').trim();
}

function googleConfig() {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || '',
    customerId: normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID),
    loginCustomerId: normalizeCustomerId(
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID ||
        ''
    ),
    loginCustomerIdMode: (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID_MODE || 'auto')
      .trim()
      .toLowerCase(),
  };
}

function israelDate(offsetDays = 0) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(Date.now() + offsetDays * 86_400_000));
}

function selectedDate() {
  const arg = process.argv.find((item) => item.startsWith('--date='));
  const value = arg ? arg.split('=')[1] : 'today';
  if (value === 'today') return israelDate(0);
  if (value === 'yesterday') return israelDate(-1);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  throw new Error(`Invalid --date value: ${value}`);
}

function utcRangeForIsraelDate(date) {
  const start = new Date(`${date}T00:00:00+03:00`);
  const end = new Date(`${date}T24:00:00+03:00`);
  return { startUtc: start.toISOString(), endUtc: end.toISOString() };
}

function numberValue(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value) {
  return `₪${Number(value || 0).toFixed(2).replace(/\.00$/, '')}`;
}

const EXPLICIT_KEEP_TERMS = new Set([
  'מידרג מחירון שיפוצים',
]);

function normalizedTerm(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

async function getAccessToken(config) {
  const missing = [
    ['GOOGLE_ADS_CLIENT_ID', config.clientId],
    ['GOOGLE_ADS_CLIENT_SECRET', config.clientSecret],
    ['GOOGLE_ADS_REFRESH_TOKEN', config.refreshToken],
  ].filter(([, value]) => !value);
  if (missing.length) {
    throw new Error(`Missing Google OAuth config: ${missing.map(([name]) => name).join(', ')}`);
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'Google OAuth refresh failed');
  }

  return payload.access_token;
}

async function googleSearch(config, accessToken, query) {
  if (!config.developerToken) throw new Error('Missing GOOGLE_ADS_DEVELOPER_TOKEN');
  if (!config.customerId) throw new Error('Missing GOOGLE_ADS_CUSTOMER_ID');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
  };

  const sendLoginCustomerId =
    config.loginCustomerId &&
    config.loginCustomerIdMode !== 'never' &&
    (config.loginCustomerIdMode === 'always' || config.customerId === config.loginCustomerId);

  if (sendLoginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId;
  }

  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${config.customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    }
  );

  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      (typeof payload === 'string' ? payload : 'Google Ads API request failed');
    throw new Error(message);
  }

  if (!Array.isArray(payload)) return [];
  return payload.flatMap((batch) => batch.results || []);
}

function classifyTerm(term, clicks, cost, conversions) {
  const text = normalizedTerm(term);
  const lower = text.toLowerCase();
  const reasons = [];
  let severity = 'watch';
  const keepTerm = EXPLICIT_KEEP_TERMS.has(text);

  const clearNegativePatterns = [
    { pattern: /פרוץ|פריצה|crack|cracked/i, reason: 'מחפש תוכן פרוץ/לא חוקי' },
    { pattern: /pdf|קובץ|להורדה|download/i, reason: 'מחפש קובץ/הורדה, לא כלי באתר' },
    { pattern: /דקל|לוי יצחק|יצחק לוי/i, reason: 'מחפש מחירון/מותג חיצוני' },
    { pattern: /חינם|free/i, reason: 'כוונת תשלום חלשה' },
  ];

  for (const item of clearNegativePatterns) {
    if (keepTerm) break;
    if (item.pattern.test(lower)) {
      severity = 'negative';
      reasons.push(item.reason);
    }
  }

  if (keepTerm) {
    reasons.push('גיא ביקש להשאיר כרגע');
  }

  if (severity !== 'negative' && clicks > 0 && conversions === 0 && cost >= 2) {
    severity = 'waste';
    reasons.push('עלה כסף בלי המרה');
  }

  if (severity !== 'negative' && /כמה עולה|עלות|מחיר|מחירון/.test(lower)) {
    reasons.push('כוונת מחקר מחיר רחבה');
  }

  if (/מידרג|הצעת מחיר|קבלן|בדיקת הצעה|הדמיית|ai|תוכנית דירה|שרטוט/.test(lower)) {
    reasons.push('רלוונטי למוצר');
  }

  return {
    term: text,
    clicks,
    cost,
    conversions,
    severity,
    reasons: reasons.length ? reasons : ['אין מספיק דאטה'],
  };
}

async function fetchSupabaseSignals(date) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { error: 'Missing Supabase env' };

  const supabase = createClient(url, key);
  const { startUtc, endUtc } = utcRangeForIsraelDate(date);

  const [{ count: usersToday, error: usersError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startUtc)
        .lt('created_at', endUtc),
      supabase
        .from('acquisition_events')
        .select('session_id,event_type,utm_source,first_source,gclid,page_path')
        .gte('created_at', startUtc)
        .lt('created_at', endUtc)
        .limit(1000),
    ]);

  if (usersError) return { error: usersError.message };
  if (eventsError) return { error: eventsError.message };

  const sessions = new Set();
  const googleEvents = [];
  const signupClicks = [];
  const googleSignupClicks = [];
  for (const event of events || []) {
    if (event.session_id) sessions.add(event.session_id);
    const source = event.utm_source || event.first_source || (event.gclid ? 'google' : 'unknown');
    if (source === 'google' || event.gclid) googleEvents.push(event);
    if (event.event_type === 'signup_click') {
      signupClicks.push(event);
      if (source === 'google' || event.gclid) googleSignupClicks.push(event);
    }
  }

  return {
    usersToday: usersToday || 0,
    eventsToday: (events || []).length,
    sessionsToday: sessions.size,
    googleEventsToday: googleEvents.length,
    signupClicksToday: signupClicks.length,
    googleSignupClicksToday: googleSignupClicks.length,
  };
}

async function diagnose(date) {
  const config = googleConfig();
  const accessToken = await getAccessToken(config);

  const campaignRows = await googleSearch(
    config,
    accessToken,
    `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.primary_status,
        campaign.primary_status_reasons,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM campaign
      WHERE segments.date = '${date}'
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `
  );

  const termRows = await googleSearch(
    config,
    accessToken,
    `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.name,
        search_term_view.search_term,
        search_term_view.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM search_term_view
      WHERE segments.date = '${date}'
        AND campaign.id = ${SEARCH_CAMPAIGN_ID}
      ORDER BY metrics.clicks DESC
      LIMIT 100
    `
  );

  const keywordRows = await googleSearch(
    config,
    accessToken,
    `
      SELECT
        campaign.id,
        ad_group.name,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM keyword_view
      WHERE segments.date = '${date}'
        AND campaign.id = ${SEARCH_CAMPAIGN_ID}
      ORDER BY metrics.clicks DESC
      LIMIT 100
    `
  );

  const campaigns = campaignRows.map((row) => ({
    id: row.campaign?.id || '',
    name: row.campaign?.name || '',
    status: row.campaign?.status || 'UNKNOWN',
    primaryStatus: row.campaign?.primaryStatus || 'UNKNOWN',
    primaryStatusReasons: row.campaign?.primaryStatusReasons || [],
    channel: row.campaign?.advertisingChannelType || 'UNKNOWN',
    bidding: row.campaign?.biddingStrategyType || 'UNKNOWN',
    budget: numberValue(row.campaignBudget?.amountMicros) / 1_000_000,
    impressions: numberValue(row.metrics?.impressions),
    clicks: numberValue(row.metrics?.clicks),
    cost: numberValue(row.metrics?.costMicros) / 1_000_000,
    conversions: numberValue(row.metrics?.conversions),
  }));

  const terms = termRows.map((row) =>
    classifyTerm(
      row.searchTermView?.searchTerm || '',
      numberValue(row.metrics?.clicks),
      numberValue(row.metrics?.costMicros) / 1_000_000,
      numberValue(row.metrics?.conversions)
    )
  );

  const keywords = keywordRows.map((row) => ({
    keyword: row.adGroupCriterion?.keyword?.text || '',
    matchType: row.adGroupCriterion?.keyword?.matchType || '',
    adGroup: row.adGroup?.name || '',
    impressions: numberValue(row.metrics?.impressions),
    clicks: numberValue(row.metrics?.clicks),
    cost: numberValue(row.metrics?.costMicros) / 1_000_000,
    conversions: numberValue(row.metrics?.conversions),
  }));

  const supabase = await fetchSupabaseSignals(date);
  return { date, campaigns, terms, keywords, supabase };
}

function renderReport(data) {
  const search = data.campaigns.find((campaign) => campaign.id === SEARCH_CAMPAIGN_ID);
  const pmax = data.campaigns.find((campaign) => campaign.channel === 'PERFORMANCE_MAX');
  const negatives = data.terms.filter((term) => term.severity === 'negative');
  const waste = data.terms.filter((term) => term.severity === 'waste');
  const watch = data.terms.filter((term) => term.severity === 'watch' && term.clicks > 0);
  const topKeywords = data.keywords.filter((keyword) => keyword.clicks > 0).slice(0, 6);

  const lines = [];
  lines.push(`אבחון יומי ל-Search של ShiputzAI - ${data.date}`);
  lines.push('');

  if (search) {
    lines.push(
      `Search: ${search.impressions} חשיפות, ${search.clicks} קליקים, ${money(search.cost)}, ${search.conversions} המרות. תקציב יומי ${money(search.budget)}.`
    );
    lines.push(
      `סטטוס: ${search.status} / ${search.primaryStatus}${search.primaryStatusReasons.length ? ` (${search.primaryStatusReasons.join(', ')})` : ''}.`
    );
  } else {
    lines.push('Search: לא נמצאו נתונים לקמפיין החיפוש.');
  }

  if (pmax) {
    lines.push(
      `PMax לידיעה: ${pmax.impressions} חשיפות, ${pmax.clicks} קליקים, ${money(pmax.cost)}, תקציב ${money(pmax.budget)}.`
    );
  }

  if (!data.supabase.error) {
    lines.push(
      `אתר: ${data.supabase.usersToday} הרשמות, ${data.supabase.sessionsToday} סשנים מתועדים, ${data.supabase.googleEventsToday} אירועי Google, ${data.supabase.googleSignupClicksToday} לחיצות הרשמה מ-Google (${data.supabase.signupClicksToday} כלליות).`
    );
  } else {
    lines.push(`אתר: לא הצלחתי לבדוק Supabase (${data.supabase.error}).`);
  }

  lines.push('');

  if (negatives.length) {
    lines.push('מונחים שכדאי לחסום:');
    for (const term of negatives.slice(0, 8)) {
      lines.push(`- "${term.term}" - ${term.clicks} קליקים, ${money(term.cost)}. סיבה: ${term.reasons.join(', ')}.`);
    }
  } else {
    lines.push('מונחים שכדאי לחסום: לא נמצאו היום מונחים חד-משמעיים לחסימה.');
  }

  if (waste.length) {
    lines.push('');
    lines.push('מונחים שעולים כסף בלי המרה ושווה לעקוב/לשפר להם נחיתה:');
    for (const term of waste.slice(0, 8)) {
      lines.push(`- "${term.term}" - ${term.clicks} קליקים, ${money(term.cost)}. ${term.reasons.join(', ')}.`);
    }
  }

  if (watch.length) {
    lines.push('');
    lines.push('מונחים לא רעים אבל עדיין בלי הוכחת הרשמה:');
    for (const term of watch.slice(0, 6)) {
      lines.push(`- "${term.term}" - ${term.clicks} קליקים, ${money(term.cost)}. ${term.reasons.join(', ')}.`);
    }
  }

  if (topKeywords.length) {
    lines.push('');
    lines.push('מילות המפתח שהביאו קליקים:');
    for (const keyword of topKeywords) {
      lines.push(`- ${keyword.keyword} (${keyword.matchType}) - ${keyword.clicks} קליקים, ${money(keyword.cost)}.`);
    }
  }

  lines.push('');
  if (negatives.length) {
    lines.push('פעולה מומלצת: להוסיף שליליות מדויקות/ביטוי למונחים הברורים למעלה, אחרי אישור של גיא.');
  } else if (search && search.clicks >= 8 && search.conversions === 0) {
    lines.push('פעולה מומלצת: לא להעלות תקציב. לשפר את עמוד הנחיתה/CTA לפני שמגדילים הוצאה.');
  } else {
    lines.push('פעולה מומלצת: להמשיך לאסוף דאטה, בלי שינוי תקציב עיוור.');
  }

  return lines.join('\n');
}

async function main() {
  loadEnv();
  const date = selectedDate();
  const data = await diagnose(date);

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log(renderReport(data));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
