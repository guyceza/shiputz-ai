import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const GOOGLE_ADS_API_VERSION = process.env.GOOGLE_ADS_API_VERSION || "v24";
const META_API_VERSION = process.env.META_API_VERSION || "v21.0";
const META_AD_ACCOUNT_ID =
  process.env.META_AD_ACCOUNT_ID || "act_1215839217370072";
const META_TOKEN_PATH = "/home/ubuntu/clawd/config/meta-shiputzai-token.txt";

type PlatformStatus = "ok" | "missing_config" | "blocked" | "error";
type AdsDateRangeKey = "day" | "week" | "month" | "all";

interface AdsDateRange {
  key: AdsDateRangeKey;
  label: string;
  startDate: string | null;
  endDate: string;
}

interface CampaignRow {
  id: string;
  name: string;
  status: string;
  channel: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  ctr: number;
  cpc: number;
}

interface PlatformPayload {
  status: PlatformStatus;
  accountName: string;
  accountId: string;
  currency: string;
  updatedAt: string;
  message?: string;
  metrics: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
  };
  campaigns: CampaignRow[];
}

interface GoogleAdsConfig {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId: string;
  loginCustomerIdMode: string;
}

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

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

function loadLocalEnv() {
  loadEnvFile(path.join(process.cwd(), ".env"));
  loadEnvFile(path.join(process.cwd(), ".env.local"));
  loadEnvFile(path.join(process.env.HOME || "/home/ubuntu", ".env"));
}

function normalizeCustomerId(value: string | undefined) {
  return (value || "").replace(/-/g, "").trim();
}

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function dateInIsrael(offsetDays = 0) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + offsetDays * 86_400_000));
}

function getDateRange(value: string | null): AdsDateRange {
  const key: AdsDateRangeKey =
    value === "day" || value === "week" || value === "month" || value === "all"
      ? value
      : "week";
  const today = dateInIsrael();

  if (key === "day") {
    return { key, label: "היום", startDate: today, endDate: today };
  }

  if (key === "month") {
    return {
      key,
      label: "30 הימים האחרונים",
      startDate: dateInIsrael(-29),
      endDate: today,
    };
  }

  if (key === "all") {
    return {
      key,
      label: "כל הזמן",
      startDate: null,
      endDate: today,
    };
  }

  return {
    key,
    label: "7 הימים האחרונים",
    startDate: dateInIsrael(-6),
    endDate: today,
  };
}

function googleDateFilter(range: AdsDateRange) {
  if (!range.startDate) return "";
  if (range.startDate === range.endDate) {
    return `segments.date = '${range.endDate}'`;
  }
  return `segments.date BETWEEN '${range.startDate}' AND '${range.endDate}'`;
}

function getGoogleAdsConfig(): GoogleAdsConfig {
  return {
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
    clientId: process.env.GOOGLE_ADS_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET || "",
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN || "",
    customerId: normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID),
    loginCustomerId: normalizeCustomerId(
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ||
        process.env.GOOGLE_ADS_MANAGER_CUSTOMER_ID
    ),
    loginCustomerIdMode: (
      process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID_MODE || "auto"
    )
      .trim()
      .toLowerCase(),
  };
}

function emptyPlatform(
  status: PlatformStatus,
  accountName: string,
  accountId: string,
  message?: string
): PlatformPayload {
  return {
    status,
    accountName,
    accountId,
    currency: "ILS",
    updatedAt: new Date().toISOString(),
    message,
    metrics: {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
    },
    campaigns: [],
  };
}

async function refreshGoogleAccessToken(config: GoogleAdsConfig) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description || payload.error || "OAuth refresh failed"
    );
  }

  return payload.access_token;
}

async function googleAdsSearch<T>(
  config: GoogleAdsConfig,
  accessToken: string,
  customerId: string,
  query: string
): Promise<T[]> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
    "developer-token": config.developerToken,
  };

  const sendManagerHeader =
    config.loginCustomerId &&
    config.loginCustomerIdMode !== "never" &&
    (config.loginCustomerIdMode === "always" ||
      customerId === config.loginCustomerId);

  if (sendManagerHeader) {
    headers["login-customer-id"] = config.loginCustomerId;
  }

  const response = await fetch(
    `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    }
  );

  const payload = (await response.json().catch(() => null)) as
    | Array<{ results?: T[]; error?: unknown }>
    | { error?: { message?: string } }
    | null;

  if (!response.ok) {
    const message =
      !Array.isArray(payload) && payload?.error?.message
        ? payload.error.message
        : "Google Ads API request failed";
    throw new Error(message);
  }

  if (!Array.isArray(payload)) return [];
  return payload.flatMap((batch) => batch.results || []);
}

async function fetchGoogleAds(range: AdsDateRange): Promise<PlatformPayload> {
  const config = getGoogleAdsConfig();
  const missing = [
    ["GOOGLE_ADS_DEVELOPER_TOKEN", config.developerToken],
    ["GOOGLE_ADS_CLIENT_ID", config.clientId],
    ["GOOGLE_ADS_CLIENT_SECRET", config.clientSecret],
    ["GOOGLE_ADS_REFRESH_TOKEN", config.refreshToken],
    ["GOOGLE_ADS_CUSTOMER_ID", config.customerId],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    return emptyPlatform(
      "missing_config",
      "ה-Google Ads",
      config.customerId,
      `חסרים משתנים: ${missing.join(", ")}`
    );
  }

  try {
    const accessToken = await refreshGoogleAccessToken(config);
    const campaignWhere = [
      googleDateFilter(range),
      "campaign.status != 'REMOVED'",
    ].filter(Boolean);
    const [customerRows, campaignRows] = await Promise.all([
      googleAdsSearch<{
        customer?: {
          id?: string;
          descriptiveName?: string;
          currencyCode?: string;
        };
      }>(
        config,
        accessToken,
        config.customerId,
        `
          SELECT
            customer.id,
            customer.descriptive_name,
            customer.currency_code
          FROM customer
          LIMIT 1
        `
      ),
      googleAdsSearch<{
        campaign?: {
          id?: string;
          name?: string;
          status?: string;
          advertisingChannelType?: string;
        };
        metrics?: {
          impressions?: string | number;
          clicks?: string | number;
          costMicros?: string | number;
          conversions?: string | number;
        };
      }>(
        config,
        accessToken,
        config.customerId,
        `
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
          WHERE ${campaignWhere.join("\n            AND ")}
          ORDER BY metrics.cost_micros DESC
          LIMIT 50
        `
      ),
    ]);

    const campaigns = campaignRows.map((row) => {
      const impressions = numberValue(row.metrics?.impressions);
      const clicks = numberValue(row.metrics?.clicks);
      const spend = numberValue(row.metrics?.costMicros) / 1_000_000;
      const conversions = numberValue(row.metrics?.conversions);

      return {
        id: row.campaign?.id || "",
        name: row.campaign?.name || "ללא שם",
        status: row.campaign?.status || "UNKNOWN",
        channel: row.campaign?.advertisingChannelType || "UNKNOWN",
        impressions,
        clicks,
        spend,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
      };
    });

    const totals = campaigns.reduce(
      (acc, campaign) => ({
        spend: acc.spend + campaign.spend,
        impressions: acc.impressions + campaign.impressions,
        clicks: acc.clicks + campaign.clicks,
        conversions: acc.conversions + campaign.conversions,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    const customer = customerRows[0]?.customer;

    return {
      status: "ok",
      accountName: customer?.descriptiveName || "ה-Google Ads",
      accountId: customer?.id || config.customerId,
      currency: customer?.currencyCode || "ILS",
      updatedAt: new Date().toISOString(),
      metrics: {
        ...totals,
        ctr:
          totals.impressions > 0
            ? (totals.clicks / totals.impressions) * 100
            : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      },
      campaigns,
    };
  } catch (error) {
    return emptyPlatform(
      "error",
      "ה-Google Ads",
      config.customerId,
      error instanceof Error ? error.message : "Google Ads API error"
    );
  }
}

function getMetaToken() {
  if (process.env.META_ACCESS_TOKEN) return process.env.META_ACCESS_TOKEN;
  if (fs.existsSync(META_TOKEN_PATH)) {
    return fs.readFileSync(META_TOKEN_PATH, "utf8").trim();
  }
  return "";
}

function metaActionValue(
  actions: Array<{ action_type?: string; value?: string | number }> | undefined,
  types: string | string[]
) {
  const wanted = Array.isArray(types) ? types : [types];
  return (actions || [])
    .filter((action) => action.action_type && wanted.includes(action.action_type))
    .reduce((sum, action) => sum + numberValue(action.value), 0);
}

async function graph<T extends object>(
  pathName: string,
  params: Record<string, unknown>
) {
  const token = getMetaToken();
  if (!token) {
    throw new Error("Missing META_ACCESS_TOKEN");
  }

  const url = new URL(
    `https://graph.facebook.com/${META_API_VERSION}/${pathName.replace(/^\/+/, "")}`
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(
      key,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  }
  url.searchParams.set("access_token", token);

  const response = await fetch(url);
  const payload = (await response.json().catch(() => ({}))) as
    | T
    | { error?: { message?: string; code?: number } };

  if ("error" in payload && payload.error) {
    const message = payload.error.message || "Meta API error";
    const code = payload.error.code ? ` (${payload.error.code})` : "";
    throw new Error(`${message}${code}`);
  }

  return payload as T;
}

async function fetchMetaAds(range: AdsDateRange): Promise<PlatformPayload> {
  try {
    const insightParams: Record<string, unknown> = {
      fields:
        "campaign_id,campaign_name,spend,impressions,clicks,inline_link_clicks,actions",
      level: "campaign",
      limit: 50,
    };

    if (range.startDate) {
      insightParams.time_range = {
        since: range.startDate,
        until: range.endDate,
      };
    } else {
      insightParams.date_preset = "maximum";
    }

    const [account, insights] = await Promise.all([
      graph<{
        id?: string;
        name?: string;
        currency?: string;
      }>(META_AD_ACCOUNT_ID, {
        fields: "id,name,currency",
      }),
      graph<{
        data?: Array<{
          campaign_id?: string;
          campaign_name?: string;
          spend?: string;
          impressions?: string;
          clicks?: string;
          inline_link_clicks?: string;
          actions?: Array<{ action_type?: string; value?: string }>;
        }>;
      }>(`${META_AD_ACCOUNT_ID}/insights`, insightParams),
    ]);

    const campaigns = (insights.data || []).map((row) => {
      const impressions = numberValue(row.impressions);
      const clicks =
        numberValue(row.inline_link_clicks) || numberValue(row.clicks);
      const spend = numberValue(row.spend);
      const conversions = metaActionValue(row.actions, [
        "purchase",
        "offsite_conversion.fb_pixel_purchase",
        "lead",
        "offsite_conversion.fb_pixel_lead",
      ]);

      return {
        id: row.campaign_id || "",
        name: row.campaign_name || "ללא שם",
        status: "ACTIVE",
        channel: "META",
        impressions,
        clicks,
        spend,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
      };
    });

    const totals = campaigns.reduce(
      (acc, campaign) => ({
        spend: acc.spend + campaign.spend,
        impressions: acc.impressions + campaign.impressions,
        clicks: acc.clicks + campaign.clicks,
        conversions: acc.conversions + campaign.conversions,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    );

    return {
      status: "ok",
      accountName: account.name || "ה-Meta Ads",
      accountId: account.id || META_AD_ACCOUNT_ID,
      currency: account.currency || "ILS",
      updatedAt: new Date().toISOString(),
      metrics: {
        ...totals,
        ctr:
          totals.impressions > 0
            ? (totals.clicks / totals.impressions) * 100
            : 0,
        cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
      },
      campaigns,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Meta Marketing API error";
    return emptyPlatform(
      message.includes("API access blocked") ? "blocked" : "error",
      "ה-Meta Ads",
      META_AD_ACCOUNT_ID,
      message
    );
  }
}

function buildInsights(google: PlatformPayload, meta: PlatformPayload) {
  const insights: Array<{ tone: "good" | "warn" | "info"; text: string }> = [];

  if (google.status === "ok" && google.metrics.spend > 0) {
    if (google.metrics.conversions === 0) {
      insights.push({
        tone: "warn",
        text: "ה-Google Ads מוציא כסף בלי המרות מדווחות. לפני שמגדילים תקציב, צריך לוודא שהמרת רכישה/הרשמה נמדדת נכון.",
      });
    }
    if (google.metrics.clicks > 0 && google.metrics.cpc < 1) {
      insights.push({
        tone: "good",
        text: "ה-CPC של ה-Google Ads נמוך כרגע. זה טוב לאיסוף דאטה, אבל צריך לשפוט לפי איכות משתמשים ולא רק קליקים.",
      });
    }
  }

  if (meta.status === "blocked") {
    insights.push({
      tone: "warn",
      text: "ה-Meta Ads עדיין חסום ב-API access blocked. הדשבורד מוכן, אבל צריך לתקן את ה-token או את ה-Meta App כדי לקבל נתוני Meta חיים.",
    });
  } else if (meta.status === "ok" && meta.metrics.spend > google.metrics.spend) {
    insights.push({
      tone: "info",
      text: "ה-Meta Ads הוא מקור ההוצאה המרכזי. כדאי להשוות אותו מול ה-Google Ads לפי עלות להמרה, לא לפי קליקים בלבד.",
    });
  }

  if (!insights.length) {
    insights.push({
      tone: "info",
      text: "יש חיבור נתונים בסיסי. השלב הבא הוא לחבר אירועי המרה אחידים משני המקורות כדי לקבל החלטות תקציב אמיתיות.",
    });
  }

  return insights;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  loadLocalEnv();
  const range = getDateRange(request.nextUrl.searchParams.get("range"));

  const [google, meta] = await Promise.all([
    fetchGoogleAds(range),
    fetchMetaAds(range),
  ]);

  return NextResponse.json({
    updatedAt: new Date().toISOString(),
    range: range.key,
    rangeLabel: range.label,
    dateRange: {
      from: range.startDate,
      to: range.endDate,
    },
    google,
    meta,
    combined: {
      spend: google.metrics.spend + meta.metrics.spend,
      impressions: google.metrics.impressions + meta.metrics.impressions,
      clicks: google.metrics.clicks + meta.metrics.clicks,
      conversions: google.metrics.conversions + meta.metrics.conversions,
    },
    insights: buildInsights(google, meta),
  });
}
