"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { ADMIN_EMAILS, isAdmin as isAdminCheck } from "@/lib/admin";
import { adminFetch } from "@/lib/admin-api";

interface Lead {
  id: string;
  email: string;
  name: string;
  city: string;
  phone: string;
  website: string;
  profession: string;
  source: string;
  rating: number | null;
  status: string;
  created_at: string;
  unsubscribed: boolean;
  email1_status: string | null;
  email1_sent_at: string | null;
  email2_status: string | null;
  email2_sent_at: string | null;
  last_event: string | null;
  last_event_at: string | null;
  quality_score: number;
  in_next_batch: boolean;
}

type SortKey = keyof Lead;
type SortDir = "asc" | "desc";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 text-gray-700",
  pending: "bg-yellow-100 text-yellow-700",
  email1_sent: "bg-blue-100 text-blue-700",
  email2_sent: "bg-indigo-100 text-indigo-700",
  bounced: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-600",
  opened: "bg-green-100 text-green-700",
  delivered: "bg-cyan-100 text-cyan-700",
  clicked: "bg-amber-100 text-amber-700",
  complained: "bg-red-200 text-red-800",
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "חדש",
  pending: "ממתין",
  email1_sent: "מייל 1 נשלח",
  email2_sent: "מייל 2 נשלח",
  bounced: "חזר",
  error: "שגיאה",
  unsubscribed: "הוסר",
};

const EMAIL_STATUS_BADGE: Record<string, { color: string; label: string }> = {
  sent: { color: "bg-blue-100 text-blue-700", label: "נשלח" },
  delivered: { color: "bg-cyan-100 text-cyan-700", label: "נמסר" },
  opened: { color: "bg-green-100 text-green-700", label: "נפתח" },
  clicked: { color: "bg-amber-100 text-amber-800", label: "לחץ על לינק" },
  bounced: { color: "bg-red-100 text-red-700", label: "חזר" },
  error: { color: "bg-red-100 text-red-600", label: "שגיאה" },
  complained: { color: "bg-red-200 text-red-800", label: "תלונה" },
};

const SEGMENT_LABELS: Record<string, { label: string; description: string }> = {
  email1_any: {
    label: "נשלח מייל 1",
    description: "לידים שקיבלו את המייל הראשון בכל סטטוס",
  },
  email2_any: {
    label: "נשלח מייל 2",
    description: "לידים שקיבלו את מייל ההמשך בכל סטטוס",
  },
  sent_today: {
    label: "נשלח היום",
    description: "לידים שקיבלו מייל היום",
  },
  delivered: {
    label: "נמסרו",
    description: "מיילים שהגיעו לתיבה",
  },
  opened: {
    label: "פתחו",
    description: "לידים שפתחו מייל או לחצו על לינק",
  },
  clicked: {
    label: "לחצו על הלינק",
    description: "לידים שלחצו על לינק במייל 1 או במייל 2",
  },
  bounced: {
    label: "חזרו",
    description: "מיילים שחזרו ולא נמסרו",
  },
  complained: {
    label: "התלוננו",
    description: "לידים שסימנו את המייל כתלונה",
  },
  error: {
    label: "שגיאות",
    description: "מיילים שנכשלו בשליחה או בעיבוד",
  },
  remaining: {
    label: "נותרו לשליחה",
    description: "לידים שעדיין ממתינים לתחילת הקמפיין",
  },
};

const PROFESSIONS: Record<string, string> = {
  "מעצבי פנים": "מעצבי פנים",
  "אדריכלים": "אדריכלים",
  "קבלני שיפוצים": "קבלני שיפוצים",
  "מטבחים ואמבטיות": "מטבחים ואמבטיות",
  "נגרות אדריכלית": "נגרות אדריכלית",
  "תאורה ועיצוב": "תאורה ועיצוב",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getLeadStatusLabel(status: string) {
  return LEAD_STATUS_LABELS[status] || status;
}

function getLeadEngagementSummary(lead: Lead) {
  if (lead.email2_status === "clicked") return "לחץ על לינק במייל 2";
  if (lead.email1_status === "clicked") return "לחץ על לינק במייל 1";
  if (lead.email2_status === "opened") return "פתח את מייל 2";
  if (lead.email1_status === "opened") return "פתח את מייל 1";
  if (lead.email2_status === "delivered") return "מייל 2 נמסר";
  if (lead.email1_status === "delivered") return "מייל 1 נמסר";
  if (lead.email2_status === "bounced") return "מייל 2 חזר";
  if (lead.email1_status === "bounced") return "מייל 1 חזר";
  return null;
}

export default function LeadsListPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProfession, setFilterProfession] = useState<string>("all");
  const [filterEmail1, setFilterEmail1] = useState<string>("all");
  const [filterEmail2, setFilterEmail2] = useState<string>("all");
  const [filterUnsubscribed, setFilterUnsubscribed] = useState<string>("all");
  const [filterSegment, setFilterSegment] = useState<string>("all");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("quality_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 50;

  useEffect(() => {
    const email = ADMIN_EMAILS.find((e) => isAdminCheck(e));
    if (email) {
      setAdminEmail(email);
    } else {
      const stored = localStorage.getItem("adminEmail");
      if (stored && isAdminCheck(stored)) {
        setAdminEmail(stored);
      } else {
        setAdminEmail(ADMIN_EMAILS[0]);
      }
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await adminFetch("/api/admin/leads-list");
      if (!resp.ok) throw new Error("Failed to fetch");
      const data = await resp.json();
      setLeads(data.leads);
      setError(null);
    } catch {
      setError("שגיאה בטעינה");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminEmail) fetchLeads();
  }, [adminEmail, fetchLeads]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const segment = params.get("segment");
    const status = params.get("status");
    const profession = params.get("profession");
    const email1 = params.get("email1");
    const email2 = params.get("email2");
    const unsubscribed = params.get("unsubscribed");
    const q = params.get("q");

    if (segment) setFilterSegment(segment);
    if (status) setFilterStatus(status);
    if (profession) setFilterProfession(profession);
    if (email1) setFilterEmail1(email1);
    if (email2) setFilterEmail2(email2);
    if (unsubscribed) setFilterUnsubscribed(unsubscribed);
    if (q) setSearch(q);
  }, []);

  // Filtered + sorted leads
  const filtered = useMemo(() => {
    let result = leads;

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.email.toLowerCase().includes(q) ||
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.profession.toLowerCase().includes(q)
      );
    }

    // Filters
    if (filterStatus !== "all") result = result.filter((l) => l.status === filterStatus);
    if (filterProfession !== "all") result = result.filter((l) => l.profession === filterProfession);
    if (filterEmail1 !== "all") {
      if (filterEmail1 === "not_sent") result = result.filter((l) => !l.email1_status);
      else if (filterEmail1 === "any") result = result.filter((l) => !!l.email1_status);
      else result = result.filter((l) => l.email1_status === filterEmail1);
    }
    if (filterEmail2 !== "all") {
      if (filterEmail2 === "not_sent") result = result.filter((l) => !l.email2_status);
      else if (filterEmail2 === "any") result = result.filter((l) => !!l.email2_status);
      else result = result.filter((l) => l.email2_status === filterEmail2);
    }
    if (filterUnsubscribed !== "all") {
      result = result.filter((l) => (filterUnsubscribed === "yes" ? l.unsubscribed : !l.unsubscribed));
    }
    if (filterSegment !== "all") {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      result = result.filter((l) => {
        if (filterSegment === "email1_any") return !!l.email1_status;
        if (filterSegment === "email2_any") return !!l.email2_status;
        if (filterSegment === "remaining") return ["new", "pending"].includes(l.status);
        if (filterSegment === "sent_today") {
          const email1Today = l.email1_sent_at ? new Date(l.email1_sent_at) >= today : false;
          const email2Today = l.email2_sent_at ? new Date(l.email2_sent_at) >= today : false;
          return email1Today || email2Today;
        }
        return l.email1_status === filterSegment || l.email2_status === filterSegment || l.status === filterSegment;
      });
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? "";
      const bVal = b[sortKey] ?? "";
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [leads, search, filterStatus, filterProfession, filterEmail1, filterEmail2, filterUnsubscribed, filterSegment, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [search, filterStatus, filterProfession, filterEmail1, filterEmail2, filterUnsubscribed, filterSegment]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortArrow({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  // Stats summary
  const statsSummary = useMemo(() => {
    const total = leads.length;
    const sent = leads.filter((l) => l.email1_status || l.email2_status).length;
    const opened = leads.filter((l) => l.email1_status === "opened" || l.email2_status === "opened" || l.email1_status === "clicked" || l.email2_status === "clicked").length;
    const clicked = leads.filter((l) => l.email1_status === "clicked" || l.email2_status === "clicked").length;
    const bounced = leads.filter((l) => l.email1_status === "bounced" || l.email2_status === "bounced" || l.status === "bounced").length;
    const unsub = leads.filter((l) => l.unsubscribed).length;
    const newLeads = leads.filter((l) => l.status === "new").length;
    return { total, sent, opened, clicked, bounced, unsub, newLeads };
  }, [leads]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-lg">טוען לידים...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 sticky top-0 z-20">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/leads" className="text-gray-400 hover:text-gray-600 text-sm">
              ← חזרה לדשבורד
            </Link>
            <h1 className="text-xl font-bold text-gray-900">כל הלידים</h1>
            <span className="text-sm text-gray-500">({filtered.length} מתוך {leads.length})</span>
          </div>
          <button
            onClick={() => adminEmail && fetchLeads()}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition"
          >
            🔄 רענן
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-7 gap-3 mb-4">
          {[
            { label: "סה״כ", value: statsSummary.total, color: "bg-white" },
            { label: "חדשים", value: statsSummary.newLeads, color: "bg-gray-50" },
            { label: "נשלחו", value: statsSummary.sent, color: "bg-blue-50" },
            { label: "נפתחו", value: statsSummary.opened, color: "bg-green-50" },
            { label: "לחצו על לינק", value: statsSummary.clicked, color: "bg-amber-50" },
            { label: "חזרו", value: statsSummary.bounced, color: "bg-red-50" },
            { label: "הסירו", value: statsSummary.unsub, color: "bg-gray-50" },
          ].map((s) => (
            <div key={s.label} className={`${s.color} rounded-lg p-3 text-center border`}>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Color Legend */}
        <div className="bg-white rounded-lg border p-3 mb-4 flex flex-wrap gap-4 items-center text-xs text-gray-600">
          <span className="font-medium text-gray-800">מקרא צבעים:</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> בתור לשליחה הבאה</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> נשלח מייל #1</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300" /> נשלח מייל #2</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-300" /> לא נשלח עדיין</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> נקודה = בתור</span>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <input
              type="text"
              placeholder="🔍 חיפוש שם, מייל, עיר, טלפון..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm w-72 focus:ring-2 focus:ring-blue-300 focus:outline-none"
            />

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="new">חדש</option>
              <option value="pending">ממתין</option>
              <option value="email1_sent">מייל 1 נשלח</option>
              <option value="email2_sent">מייל 2 נשלח</option>
              <option value="bounced">חזר</option>
              <option value="error">שגיאה</option>
            </select>

            {/* Segment filter */}
            <select
              value={filterSegment}
              onChange={(e) => setFilterSegment(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">קוביה / אירוע - הכל</option>
              <option value="email1_any">נשלח מייל 1</option>
              <option value="email2_any">נשלח מייל 2</option>
              <option value="sent_today">נשלח היום</option>
              <option value="delivered">נמסר</option>
              <option value="opened">נפתח</option>
              <option value="clicked">לחץ על לינק</option>
              <option value="bounced">חזר</option>
              <option value="complained">התלונן</option>
              <option value="error">שגיאה</option>
              <option value="remaining">נותר לשליחה</option>
            </select>

            {/* Profession filter */}
            <select
              value={filterProfession}
              onChange={(e) => setFilterProfession(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">כל המקצועות</option>
              {Object.entries(PROFESSIONS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Email 1 filter */}
            <select
              value={filterEmail1}
              onChange={(e) => setFilterEmail1(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">מייל 1 - הכל</option>
              <option value="not_sent">לא נשלח</option>
              <option value="any">נשלח בכל סטטוס</option>
              <option value="sent">נשלח</option>
              <option value="delivered">נמסר</option>
              <option value="opened">נפתח</option>
              <option value="clicked">לחץ על לינק</option>
              <option value="bounced">חזר</option>
            </select>

            {/* Email 2 filter */}
            <select
              value={filterEmail2}
              onChange={(e) => setFilterEmail2(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">מייל 2 - הכל</option>
              <option value="not_sent">לא נשלח</option>
              <option value="any">נשלח בכל סטטוס</option>
              <option value="sent">נשלח</option>
              <option value="delivered">נמסר</option>
              <option value="opened">נפתח</option>
              <option value="clicked">לחץ על לינק</option>
              <option value="bounced">חזר</option>
            </select>

            {/* Unsubscribed filter */}
            <select
              value={filterUnsubscribed}
              onChange={(e) => setFilterUnsubscribed(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="all">הסרה - הכל</option>
              <option value="yes">הוסרו</option>
              <option value="no">פעילים</option>
            </select>

            {/* Clear filters */}
            {(search || filterStatus !== "all" || filterProfession !== "all" || filterEmail1 !== "all" || filterEmail2 !== "all" || filterUnsubscribed !== "all" || filterSegment !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("all");
                  setFilterProfession("all");
                  setFilterEmail1("all");
                  setFilterEmail2("all");
                  setFilterUnsubscribed("all");
                  setFilterSegment("all");
                }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                ✕ נקה סינון
              </button>
            )}
          </div>
        </div>

        {filterSegment !== "all" && SEGMENT_LABELS[filterSegment] && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-bold">מציג: {SEGMENT_LABELS[filterSegment].label}</span>
            <span className="mx-2 text-amber-600">•</span>
            <span>{SEGMENT_LABELS[filterSegment].description}</span>
            <span className="mx-2 text-amber-600">•</span>
            <span>{filtered.length} לידים</span>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-[73px] z-10">
                <tr>
                  <th className="px-3 py-3 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                    שם <SortArrow col="name" />
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("email")}>
                    מייל <SortArrow col="email" />
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("profession")}>
                    מקצוע <SortArrow col="profession" />
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("city")}>
                    עיר <SortArrow col="city" />
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-gray-600">טלפון</th>
                  <th className="px-3 py-3 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("status")}>
                    סטטוס <SortArrow col="status" />
                  </th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">מייל 1</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600">מייל 2</th>
                  <th className="px-3 py-3 text-center font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("quality_score")}>
                    דירוג <SortArrow col="quality_score" />
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("created_at")}>
                    נוצר <SortArrow col="created_at" />
                  </th>
                  <th className="px-3 py-3 text-right font-medium text-gray-600">אתר</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginated.map((lead) => (
                  <tr key={lead.id} className={`transition ${
                    lead.unsubscribed ? "opacity-50 bg-gray-50" : 
                    lead.in_next_batch ? "bg-amber-50 hover:bg-amber-100" :
                    lead.email1_status === "clicked" || lead.email2_status === "clicked" ? "bg-amber-50/70 hover:bg-amber-100" :
                    lead.email2_status ? "bg-indigo-50/30 hover:bg-indigo-50" :
                    lead.email1_status ? "bg-blue-50/30 hover:bg-blue-50" :
                    "hover:bg-gray-50"
                  }`}>
                    <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[200px] truncate" title={lead.name}>
                      {lead.in_next_batch && <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" title="בתור לשליחה הבאה" />}
                      {lead.name || "-"}
                      {lead.unsubscribed && <span className="text-red-500 text-xs mr-1">🚫</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[220px] truncate" title={lead.email}>
                      <a href={`mailto:${lead.email}`} className="hover:text-blue-600">{lead.email}</a>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{lead.profession || "-"}</td>
                    <td className="px-3 py-2.5 text-gray-600">{lead.city || "-"}</td>
                    <td className="px-3 py-2.5 text-gray-600 font-mono text-xs" dir="ltr">{lead.phone || "-"}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-600"}`}
                          title={lead.status}
                        >
                          {getLeadStatusLabel(lead.status)}
                        </span>
                        {getLeadEngagementSummary(lead) && (
                          <span className="text-[11px] font-medium text-amber-800">
                            {getLeadEngagementSummary(lead)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {lead.email1_status ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${EMAIL_STATUS_BADGE[lead.email1_status]?.color || "bg-gray-100"}`}
                          title={lead.email1_sent_at ? formatDateTime(lead.email1_sent_at) : ""}
                        >
                          {EMAIL_STATUS_BADGE[lead.email1_status]?.label || lead.email1_status}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {lead.email2_status ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${EMAIL_STATUS_BADGE[lead.email2_status]?.color || "bg-gray-100"}`}
                          title={lead.email2_sent_at ? formatDateTime(lead.email2_sent_at) : ""}
                        >
                          {EMAIL_STATUS_BADGE[lead.email2_status]?.label || lead.email2_status}
                        </span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        lead.quality_score >= 500 ? "bg-green-100 text-green-700" :
                        lead.quality_score >= 300 ? "bg-blue-100 text-blue-700" :
                        lead.quality_score >= 100 ? "bg-gray-100 text-gray-600" :
                        "bg-gray-50 text-gray-400"
                      }`}>{lead.quality_score}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{formatDate(lead.created_at)}</td>
                    <td className="px-3 py-2.5">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-xs">
                          🔗
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <div className="text-sm text-gray-500">
                עמוד {page} מתוך {totalPages} ({filtered.length} לידים)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-white transition"
                >
                  → הקודם
                </button>
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (page <= 3) pageNum = i + 1;
                  else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 rounded border text-sm transition ${
                        page === pageNum ? "bg-blue-600 text-white border-blue-600" : "hover:bg-white"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded border text-sm disabled:opacity-30 hover:bg-white transition"
                >
                  הבא ←
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Export hint */}
        <div className="text-center text-gray-400 text-xs mt-4 pb-8">
          💡 לחץ על כותרת עמודה למיון • השתמש בסינונים למציאת לידים ספציפיים
        </div>
      </div>
    </div>
  );
}
