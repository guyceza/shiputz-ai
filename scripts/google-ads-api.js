#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const API_VERSION = process.env.GOOGLE_ADS_API_VERSION || 'v24';
const PROJECT_ROOT = path.resolve(__dirname, '..');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
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

function getConfig() {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '';
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET || '';
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN || '';
  const accessToken = process.env.GOOGLE_ADS_OAUTH_ACCESS_TOKEN || '';
  const loginCustomerId = normalizeCustomerId(
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
      process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID ||
      ''
  );
  const customerId = normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID || '');
  const loginCustomerIdMode = (
    process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID_MODE || 'auto'
  ).trim().toLowerCase();

  return {
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    accessToken,
    loginCustomerId,
    customerId,
    loginCustomerIdMode,
  };
}

function assertPresent(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
}

async function getAccessToken(config) {
  if (config.accessToken) return config.accessToken;

  assertPresent('GOOGLE_ADS_CLIENT_ID', config.clientId);
  assertPresent('GOOGLE_ADS_CLIENT_SECRET', config.clientSecret);
  assertPresent('GOOGLE_ADS_REFRESH_TOKEN', config.refreshToken);

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
  });

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `OAuth token refresh failed (${response.status}): ${
        payload.error_description || payload.error || 'unknown error'
      }`
    );
  }

  return payload.access_token;
}

async function googleAdsRequest(config, endpoint, options = {}) {
  assertPresent('GOOGLE_ADS_DEVELOPER_TOKEN', config.developerToken);

  const accessToken = await getAccessToken(config);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'developer-token': config.developerToken,
    ...options.headers,
  };

  const shouldSendLoginCustomerId =
    config.loginCustomerId &&
    options.loginCustomerId !== false &&
    (options.loginCustomerId === true ||
      config.loginCustomerIdMode === 'always' ||
      (config.loginCustomerIdMode === 'auto' &&
        (!config.customerId || config.customerId === config.loginCustomerId)));

  if (shouldSendLoginCustomerId) {
    headers['login-customer-id'] = config.loginCustomerId;
  }

  const response = await fetch(`https://googleads.googleapis.com/${API_VERSION}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

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
      (typeof payload === 'string' ? payload : 'unknown error');
    throw new Error(`Google Ads API failed (${response.status}): ${message}`);
  }

  return payload;
}

function printStatus(config) {
  const hasOAuthBundle = Boolean(config.clientId && config.clientSecret && config.refreshToken);
  const hasAccessToken = Boolean(config.accessToken);

  console.log('Google Ads API local status');
  console.log('developer_token:', config.developerToken ? `present (${config.developerToken.length} chars)` : 'missing');
  console.log('manager_customer_id:', config.loginCustomerId || 'missing');
  console.log('manager_header_mode:', config.loginCustomerIdMode);
  console.log('customer_id:', config.customerId || 'missing');
  console.log('oauth:', hasAccessToken ? 'access token present' : hasOAuthBundle ? 'refresh-token bundle present' : 'missing');

  if (!hasAccessToken && !hasOAuthBundle) {
    console.log('');
    console.log('Missing OAuth env vars: GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN');
    console.log('Required OAuth scope: https://www.googleapis.com/auth/adwords');
  }
}

async function listAccessibleCustomers(config) {
  const data = await googleAdsRequest(config, '/customers:listAccessibleCustomers');
  const names = data.resourceNames || [];
  console.log(`accessible_customers=${names.length}`);
  for (const name of names) {
    console.log(name);
  }
}

async function listCampaigns(config) {
  assertPresent('GOOGLE_ADS_CUSTOMER_ID', config.customerId);

  const query = `
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
  `;

  const data = await googleAdsRequest(
    config,
    `/customers/${config.customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      body: { query },
    }
  );

  const rows = Array.isArray(data) ? data.flatMap((batch) => batch.results || []) : [];
  console.log(`campaign_rows=${rows.length}`);
  for (const row of rows) {
    const campaign = row.campaign || {};
    const metrics = row.metrics || {};
    const cost = Number(metrics.costMicros || 0) / 1_000_000;
    console.log(
      JSON.stringify({
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        channel: campaign.advertisingChannelType,
        impressions: Number(metrics.impressions || 0),
        clicks: Number(metrics.clicks || 0),
        cost,
        conversions: Number(metrics.conversions || 0),
      })
    );
  }
}

async function main() {
  loadEnv();
  const config = getConfig();
  const command = process.argv[2] || 'status';

  if (command === 'status') {
    printStatus(config);
    return;
  }

  if (command === 'accessible') {
    await listAccessibleCustomers(config);
    return;
  }

  if (command === 'campaigns') {
    await listCampaigns(config);
    return;
  }

  console.error(`Unknown command: ${command}`);
  console.error('Usage: node scripts/google-ads-api.js [status|accessible|campaigns]');
  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
