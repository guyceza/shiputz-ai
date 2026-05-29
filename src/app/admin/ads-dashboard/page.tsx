"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Eye,
  MousePointerClick,
  RefreshCw,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-api";

type PlatformStatus = "ok" | "missing_config" | "blocked" | "error";
type AdsDateRangeKey = "day" | "week" | "month" | "all";

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

interface AdsDashboardPayload {
  updatedAt: string;
  range: AdsDateRangeKey;
  rangeLabel: string;
  dateRange: {
    from: string | null;
    to: string;
  };
  google: PlatformPayload;
  meta: PlatformPayload;
  combined: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  };
  insights: Array<{ tone: "good" | "warn" | "info"; text: string }>;
}

const statusLabels: Record<PlatformStatus, string> = {
  ok: "מחובר",
  missing_config: "חסר קונפיג",
  blocked: "חסום",
  error: "שגיאה",
};

const rangeOptions: Array<{ key: AdsDateRangeKey; label: string }> = [
  { key: "day", label: "יום" },
  { key: "week", label: "שבוע" },
  { key: "month", label: "חודש" },
  { key: "all", label: "כל הזמן" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: value >= 10 ? 0 : 2,
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("he-IL", {
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatPercent(value: number) {
  return `${(value || 0).toFixed(2)}%`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}

function statusClass(status: PlatformStatus) {
  if (status === "ok") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "blocked" || status === "error") {
    return "bg-red-50 text-red-700 border-red-200";
  }
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function insightClass(tone: "good" | "warn" | "info") {
  if (tone === "good") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (tone === "warn") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-blue-200 bg-blue-50 text-blue-950";
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof WalletCards;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-normal text-gray-950">
            {value}
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-950 text-white">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-500">{detail}</p>
    </div>
  );
}

function PlatformPanel({
  title,
  platform,
}: {
  title: string;
  platform: PlatformPayload;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {platform.accountName} · {platform.accountId || "לא מוגדר"}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-sm ${statusClass(platform.status)}`}
          >
            {statusLabels[platform.status]}
          </span>
        </div>

        {platform.message && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            {platform.message}
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">הוצאה</p>
            <p className="mt-1 font-semibold text-gray-950">
              {formatCurrency(platform.metrics.spend)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">קליקים</p>
            <p className="mt-1 font-semibold text-gray-950">
              {formatNumber(platform.metrics.clicks)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">CTR</p>
            <p className="mt-1 font-semibold text-gray-950">
              {formatPercent(platform.metrics.ctr)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">המרות</p>
            <p className="mt-1 font-semibold text-gray-950">
              {formatNumber(platform.metrics.conversions)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-right text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">קמפיין</th>
              <th className="px-5 py-3 font-medium">סטטוס</th>
              <th className="px-5 py-3 font-medium">ערוץ</th>
              <th className="px-5 py-3 font-medium">הוצאה</th>
              <th className="px-5 py-3 font-medium">חשיפות</th>
              <th className="px-5 py-3 font-medium">קליקים</th>
              <th className="px-5 py-3 font-medium">CPC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {platform.campaigns.length > 0 ? (
              platform.campaigns.map((campaign) => (
                <tr key={`${platform.accountId}-${campaign.id || campaign.name}`}>
                  <td className="max-w-[260px] px-5 py-4 font-medium text-gray-950">
                    <span className="line-clamp-2">{campaign.name}</span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{campaign.status}</td>
                  <td className="px-5 py-4 text-gray-600">{campaign.channel}</td>
                  <td className="px-5 py-4 text-gray-950">
                    {formatCurrency(campaign.spend)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatNumber(campaign.impressions)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatNumber(campaign.clicks)}
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {formatCurrency(campaign.cpc)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-5 py-8 text-center text-gray-500" colSpan={7}>
                  אין קמפיינים להצגה בטווח הזה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function AdsDashboardPage() {
  const [data, setData] = useState<AdsDashboardPayload | null>(null);
  const [range, setRange] = useState<AdsDateRangeKey>("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (targetRange: AdsDateRangeKey) => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminFetch(
        `/api/admin/ads-dashboard?range=${targetRange}`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "טעינת הדשבורד נכשלה");
      }

      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "טעינת הדשבורד נכשלה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(range);
  }, [fetchData, range]);

  const combinedCtr = useMemo(() => {
    if (!data || data.combined.impressions === 0) return 0;
    return (data.combined.clicks / data.combined.impressions) * 100;
  }, [data]);

  const selectedRangeLabel =
    rangeOptions.find((item) => item.key === range)?.label || "";
  const isShowingStaleRange = Boolean(data && data.range !== range);
  const rangeLabel =
    isShowingStaleRange || !data ? selectedRangeLabel : data.rangeLabel;
  const dateRangeText = data && !isShowingStaleRange
    ? data.dateRange.from
      ? data.dateRange.from === data.dateRange.to
        ? formatShortDate(data.dateRange.to)
        : `${formatShortDate(data.dateRange.from)} עד ${formatShortDate(
            data.dateRange.to
          )}`
      : "כל הנתונים הזמינים"
    : "";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-950" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-950">
              חזרה לאדמין
            </Link>
            <div>
              <h1 className="text-xl font-semibold">דשבורד פרסום WED4ME</h1>
              <p className="text-sm text-gray-500">
                ה-Google Ads וה-Meta Ads במקום אחד
              </p>
            </div>
          </div>
          <button
            onClick={() => fetchData(range)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            רענון
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {loading && !data ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-gray-200 border-t-gray-950" />
              <p className="mt-4 text-sm text-gray-500">טוען נתוני פרסום...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">הדשבורד לא נטען</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">טווח נתונים</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                    {rangeLabel}
                  </h2>
                  {dateRangeText && (
                    <p className="mt-1 text-sm text-gray-500">{dateRangeText}</p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div className="grid grid-cols-2 rounded-lg border border-gray-200 bg-gray-50 p-1 text-sm sm:grid-cols-4">
                    {rangeOptions.map((option) => {
                      const active = range === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setRange(option.key)}
                          disabled={loading && active}
                          aria-pressed={active}
                          className={`min-w-[88px] rounded-md px-3 py-2 font-medium transition sm:min-w-[72px] ${
                            active
                              ? "bg-gray-950 text-white shadow-sm"
                              : "text-gray-600 hover:bg-white hover:text-gray-950"
                          } disabled:cursor-wait disabled:opacity-70`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-left text-sm text-gray-500">
                    {loading ? "מעדכן..." : `עודכן: ${formatDateTime(data.updatedAt)}`}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                icon={WalletCards}
                label="הוצאה כוללת"
                value={formatCurrency(data.combined.spend)}
                detail="סכום שני מקורות הפרסום"
              />
              <MetricCard
                icon={Eye}
                label="חשיפות"
                value={formatNumber(data.combined.impressions)}
                detail="ה-Google Ads וה-Meta Ads יחד"
              />
              <MetricCard
                icon={MousePointerClick}
                label="קליקים"
                value={formatNumber(data.combined.clicks)}
                detail={`CTR משולב ${formatPercent(combinedCtr)}`}
              />
              <MetricCard
                icon={TrendingUp}
                label="המרות"
                value={formatNumber(data.combined.conversions)}
                detail="לפי הדיווח מכל פלטפורמה"
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-gray-700" />
                  <h2 className="text-lg font-semibold">תובנות פעולה</h2>
                </div>
                <div className="mt-4 grid gap-3">
                  {data.insights.map((insight, index) => (
                    <div
                      key={`${insight.tone}-${index}`}
                      className={`rounded-lg border p-4 text-sm leading-6 ${insightClass(insight.tone)}`}
                    >
                      {insight.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <h2 className="text-lg font-semibold">סטטוס חיבורים</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {[["ה-Google Ads", data.google], ["ה-Meta Ads", data.meta]].map(
                    ([name, platform]) => (
                      <div
                        key={name as string}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-3"
                      >
                        <span className="text-sm font-medium">{name as string}</span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${statusClass((platform as PlatformPayload).status)}`}
                        >
                          {statusLabels[(platform as PlatformPayload).status]}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-2">
              <PlatformPanel title="ה-Google Ads" platform={data.google} />
              <PlatformPanel title="ה-Meta Ads" platform={data.meta} />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
