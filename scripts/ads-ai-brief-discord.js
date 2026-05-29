#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v24';
const META_API_VERSION = process.env.META_API_VERSION || 'v21.0';
const META_TOKEN_PATH = '/home/ubuntu/clawd/config/meta-shiputzai-token.txt';
const WEBHOOK_CONFIG_PATH = '/home/ubuntu/clawd/config/shiputzai-ads-discord-webhook.json';
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.SEND !== '1';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

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

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function fmtCur(value, digits = 2) {
  return `₪${num(value).toLocaleString('he-IL', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}`;
}

function fmtNum(value) {
  return Math.round(num(value)).toLocaleString('he-IL');
}

function fmtPct(value) {
  return `${num(value).toFixed(2)}%`;
}

function getWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) return process.env.DISCORD_WEBHOOK_URL;
  if (!fs.existsSync(WEBHOOK_CONFIG_PATH)) return null;
  const config = JSON.parse(fs.readFileSync(WEBHOOK_CONFIG_PATH, 'utf8'));
  return config.webhookUrl || config.webhook_url || null;
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseBody);
        } else {
          reject(new Error(`Discord webhook failed ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

function getGoogleConfig() {
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
    loginCustomerIdMode: (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID_MODE || 'auto').toLowerCase(),
  };
}

async function getGoogleAccessToken(config) {
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

async function googleAdsSearch(config, accessToken, query) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
  };

  const sendManagerHeader =
    config.loginCustomerId &&
    config.loginCustomerIdMode !== 'never' &&
    (config.loginCustomerIdMode === 'always' || config.customerId === config.loginCustomerId);

  if (sendManagerHeader) {
    headers['login-customer-id'] = config.loginCustomerId;
  }

  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${config.customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query }),
    }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Google Ads API request failed');
  }

  return Array.isArray(payload) ? payload.flatMap((batch) => batch.results || []) : [];
}

async function getGoogleSummary() {
  const config = getGoogleConfig();
  const missing = Object.entries({
    developerToken: config.developerToken,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    refreshToken: config.refreshToken,
    customerId: config.customerId,
  }).filter(([, value]) => !value);

  if (missing.length) {
    return { ok: false, platform: 'Google Ads', message: `Missing Google config: ${missing.map(([key]) => key).join(', ')}` };
  }

  const accessToken = await getGoogleAccessToken(config);
  const rows = await googleAdsSearch(config, accessToken, `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `);

  const campaigns = rows.map((row) => {
    const spend = num(row.metrics?.costMicros) / 1_000_000;
    const impressions = num(row.metrics?.impressions);
    const clicks = num(row.metrics?.clicks);
    const conversions = num(row.metrics?.conversions);

    return {
      id: row.campaign?.id || '',
      name: row.campaign?.name || 'ללא שם',
      status: row.campaign?.status || 'UNKNOWN',
      channel: row.campaign?.advertisingChannelType || 'UNKNOWN',
      spend,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
    };
  });

  const totals = campaigns.reduce((acc, campaign) => ({
    spend: acc.spend + campaign.spend,
    impressions: acc.impressions + campaign.impressions,
    clicks: acc.clicks + campaign.clicks,
    conversions: acc.conversions + campaign.conversions,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  return {
    ok: true,
    platform: 'Google Ads',
    campaigns,
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    },
  };
}

function getMetaToken() {
  if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN;
  if (!fs.existsSync(META_TOKEN_PATH)) return '';
  return fs.readFileSync(META_TOKEN_PATH, 'utf8').trim();
}

async function graph(pathName, params = {}) {
  const token = getMetaToken();
  if (!token) throw new Error('Missing Meta access token');

  const url = new URL(`https://graph.facebook.com/${META_API_VERSION}/${pathName.replace(/^\/+/, '')}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  }
  url.searchParams.set('access_token', token);

  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (payload.error) {
    throw new Error(`${payload.error.message} (${payload.error.code || 'Meta API'})`);
  }
  return payload;
}

function metaActionValue(actions, types) {
  const wanted = Array.isArray(types) ? types : [types];
  return (actions || [])
    .filter((action) => wanted.includes(action.action_type))
    .reduce((sum, action) => sum + num(action.value), 0);
}

async function getMetaSummary() {
  const adAccount = process.env.META_AD_ACCOUNT_ID || 'act_1215839217370072';
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const insights = await graph(`${adAccount}/insights`, {
    fields: 'campaign_id,campaign_name,spend,impressions,clicks,inline_link_clicks,actions',
    level: 'campaign',
    time_range: { since: weekAgo, until: today },
    limit: 50,
  });

  const campaigns = (insights.data || []).map((row) => {
    const spend = num(row.spend);
    const impressions = num(row.impressions);
    const clicks = num(row.inline_link_clicks) || num(row.clicks);
    const conversions = metaActionValue(row.actions, [
      'purchase',
      'offsite_conversion.fb_pixel_purchase',
      'lead',
      'offsite_conversion.fb_pixel_lead',
    ]);

    return {
      id: row.campaign_id || '',
      name: row.campaign_name || 'ללא שם',
      spend,
      impressions,
      clicks,
      conversions,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
    };
  });

  const totals = campaigns.reduce((acc, campaign) => ({
    spend: acc.spend + campaign.spend,
    impressions: acc.impressions + campaign.impressions,
    clicks: acc.clicks + campaign.clicks,
    conversions: acc.conversions + campaign.conversions,
  }), { spend: 0, impressions: 0, clicks: 0, conversions: 0 });

  return {
    ok: true,
    platform: 'Meta Ads',
    campaigns,
    totals: {
      ...totals,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    },
  };
}

function lineForSummary(summary) {
  if (!summary.ok) {
    return `• ה-${summary.platform}: חסום/לא זמין — ${summary.message}`;
  }

  return [
    `• ה-${summary.platform}: ${fmtCur(summary.totals.spend)} הוצאה`,
    `${fmtNum(summary.totals.impressions)} חשיפות`,
    `${fmtNum(summary.totals.clicks)} קליקים`,
    `${fmtPct(summary.totals.ctr)} CTR`,
    `${fmtNum(summary.totals.conversions)} המרות`,
  ].join(' · ');
}

function buildInsights(google, meta) {
  const insights = [];

  if (google.ok && google.totals.spend > 0 && google.totals.conversions === 0) {
    insights.push('ה-Google Ads כבר מוציא כסף בלי המרות מדווחות. לבדוק שהמרת רכישה/הרשמה נמדדת לפני הגדלת תקציב.');
  }

  if (!meta.ok) {
    insights.push('ה-Meta Ads עדיין לא נכנס לדאטה בגלל חסימת API. הדשבורד מוכן, אבל חייבים לתקן את ה-token או את ה-Meta App.');
  }

  if (google.ok && meta.ok) {
    const stronger = google.totals.cpc <= meta.totals.cpc ? 'Google Ads' : 'Meta Ads';
    insights.push(`לפי CPC בלבד ה-${stronger} זול יותר כרגע, אבל ההחלטה האמיתית צריכה להיות לפי המרות ולא לפי קליקים.`);
  }

  if (!insights.length) {
    insights.push('לא להזיז תקציבים בלי עוד דאטה. להמשיך לעקוב אחרי עלות קליק, איכות נחיתה והמרות.');
  }

  return insights.slice(0, 3);
}

async function main() {
  loadEnv();

  const [googleResult, metaResult] = await Promise.allSettled([
    getGoogleSummary(),
    getMetaSummary(),
  ]);

  const google = googleResult.status === 'fulfilled'
    ? googleResult.value
    : { ok: false, platform: 'Google Ads', message: googleResult.reason?.message || 'Google Ads failed' };
  const meta = metaResult.status === 'fulfilled'
    ? metaResult.value
    : { ok: false, platform: 'Meta Ads', message: metaResult.reason?.message || 'Meta Ads failed' };

  const insights = buildInsights(google, meta);
  const lines = [
    '**דוח פרסום יומי — ShiputzAI / WED4ME**',
    'טווח: שבעת הימים האחרונים',
    '',
    lineForSummary(google),
    lineForSummary(meta),
    '',
    '**מה לעשות עכשיו:**',
    ...insights.map((insight) => `• ${insight}`),
  ];

  const content = lines.join('\n');

  if (DRY_RUN) {
    console.log(content);
    return;
  }

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    throw new Error('Missing Discord webhook URL');
  }

  await postJson(webhookUrl, {
    username: 'ShiputzAI Ads',
    content,
    allowed_mentions: { parse: [] },
  });

  console.log('Posted ShiputzAI combined ads brief');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
