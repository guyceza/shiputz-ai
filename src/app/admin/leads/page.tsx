"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ADMIN_EMAILS, isAdmin as isAdminCheck } from "@/lib/admin";

interface LeadEmail {
  id: string;
  email: string;
  sequence_number: number;
  sent_at: string;
  status: string;
  error_message: string | null;
}

interface NextBatchLead {
  id: string;
  email: string;
  name: string;
  profession: string;
  nextEmail: number;
}

interface LeadsStats {
  total: number;
  email1Sent: number;
  email2Sent: number;
  bounced: number;
  errors: number;
  opened: number;
  delivered: number;
  complained: number;
  clicked: number;
  unsubscribed: number;
  remaining: number;
  sentToday: number;
  totalEmailsSent: number;
  warmupWeek: number;
  dailyLimit: number;
  campaignStarted: boolean;
  campaignStartDate: string | null;
  nextBatch: string;
  recentEmails: LeadEmail[];
  statusBreakdown: Record<string, number>;
  nextBatchLeads: NextBatchLead[];
}

interface EmailPreview {
  subject: string;
  body: string;
  name: string;
  profession: string;
  firstName: string;
}

export default function AdminLeads() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ email: string; seq: number; data: EmailPreview } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchStats = useCallback(async (email: string) => {
    try {
      const resp = await fetch("/api/admin/leads-stats", {
        headers: { "x-admin-email": email },
      });
      if (!resp.ok) throw new Error("Failed to fetch stats");
      const data = await resp.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError("שגיאה בטעינת הנתונים");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPreview = async (email: string, seq: number) => {
    if (!adminEmail) return;
    setPreviewLoading(true);
    try {
      const resp = await fetch(`/api/admin/lead-preview?email=${encodeURIComponent(email)}&seq=${seq}`, {
        headers: { "x-admin-email": adminEmail },
      });
      if (!resp.ok) throw new Error("Failed");
      const data = await resp.json();
      setPreview({ email, seq, data });
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.email && isAdminCheck(user.email)) {
          setAdminEmail(user.email);
          fetchStats(user.email);
          return;
        }
      } catch {}
    }
    router.push("/");
  }, [router, fetchStats]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0a0a0a" }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-red-400"
        style={{ background: "#0a0a0a" }}
      >
        {error || "שגיאה"}
      </div>
    );
  }

  const progress =
    stats.total > 0
      ? Math.round(((stats.email1Sent + stats.email2Sent) / (stats.total * 2)) * 100)
      : 0;

  const nextBatchDate = new Date(stats.nextBatch);
  const now = new Date();
  const hoursUntilNext = Math.max(
    0,
    Math.round((nextBatchDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  );
  const nextBatchLabel =
    hoursUntilNext <= 0
      ? "עכשיו"
      : hoursUntilNext <= 24
      ? `בעוד ${hoursUntilNext} שעות`
      : `מחר 09:00`;

  return (
    <div
      dir="rtl"
      className="min-h-screen text-gray-100 p-4 md:p-8"
      style={{ background: "#0a0a0a" }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">📧 לידים — קמפיין מיילים</h1>
            <p className="text-gray-400 mt-1">מעקב קמפיין מיילים</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (adminEmail) {
                  setLoading(true);
                  fetchStats(adminEmail);
                }
              }}
              disabled={loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {loading ? '⏳ טוען...' : '🔄 רענון'}
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              ← חזרה
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="סה״כ לידים" value={stats.total} icon="👥" />
          <StatCard label="נשלח מייל #1" value={stats.email1Sent} icon="📧" color="emerald" />
          <StatCard label="נשלח מייל #2" value={stats.email2Sent} icon="📨" color="blue" />
          <StatCard label="נשלח היום" value={stats.sentToday} icon="📤" color="yellow" />
          <StatCard label="נמסרו" value={stats.delivered || 0} icon="✅" color="emerald" />
          <StatCard label="פתחו" value={stats.opened || 0} icon="👀" color="blue" />
          <StatCard label="לחצו על הלינק" value={stats.clicked || 0} icon="🔗" color="emerald" />
          <StatCard label="באונס" value={stats.bounced} icon="⚠️" color="red" />
          <StatCard label="התלוננו" value={stats.complained || 0} icon="🚨" color="red" />
          <StatCard label="הסירו עצמם" value={stats.unsubscribed} icon="🚫" color="orange" />
          <StatCard label="שגיאות" value={stats.errors} icon="❌" color="red" />
          <StatCard label="נותרו לשלוח" value={stats.remaining} icon="📋" color="purple" />
        </div>

        {/* Progress + Warm-up */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Progress Bar */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">התקדמות קמפיין</h3>
            <div className="w-full bg-gray-800 rounded-full h-4 mb-3">
              <div
                className="bg-emerald-500 rounded-full h-4 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>{progress}% הושלם</span>
              <span>
                {stats.totalEmailsSent} / {stats.total * 2} מיילים
              </span>
            </div>
          </div>

          {/* Warm-up Phase */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">שלב חימום</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-semibold text-emerald-400">
                    שבוע {stats.warmupWeek} — {stats.dailyLimit}/יום
                  </div>
                  <div className="text-sm text-gray-400">
                    {stats.campaignStarted
                      ? `התחיל ב-${new Date(stats.campaignStartDate!).toLocaleDateString("he-IL")}`
                      : "טרם התחיל"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏰</span>
                <div>
                  <div className="font-semibold">
                    שליחה הבאה: {nextBatchLabel}
                  </div>
                  <div className="text-sm text-gray-400">
                    {nextBatchDate.toLocaleDateString("he-IL", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}{" "}
                    09:00
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h3 className="text-lg font-semibold mb-4">פילוח סטטוסים</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.statusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2"
              >
                <span className="text-sm font-mono text-gray-400">{status}</span>
                <span className="font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Batch Preview */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h3 className="text-lg font-semibold mb-4">
            📋 שליחה הבאה — {stats.nextBatchLeads?.length || 0} לידים
          </h3>
          {!stats.nextBatchLeads?.length ? (
            <p className="text-gray-500 text-center py-4">אין לידים בתור</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-right py-2 px-3">#</th>
                    <th className="text-right py-2 px-3">מייל</th>
                    <th className="text-right py-2 px-3">שם</th>
                    <th className="text-right py-2 px-3">מקצוע</th>
                    <th className="text-right py-2 px-3">מייל הבא</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.nextBatchLeads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                      onClick={() => fetchPreview(lead.email, lead.nextEmail)}
                    >
                      <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                      <td className="py-2 px-3 font-mono text-xs text-emerald-400 underline">{lead.email}</td>
                      <td className="py-2 px-3">{lead.name || '—'}</td>
                      <td className="py-2 px-3 text-gray-400">{lead.profession || 'מעצבי פנים'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${lead.nextEmail === 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-blue-500/20 text-blue-300'}`}>
                          מייל #{lead.nextEmail}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">פעילות אחרונה</h3>
          {stats.recentEmails.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              עדיין לא נשלחו מיילים
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="text-right py-2 px-3">מייל</th>
                    <th className="text-right py-2 px-3">מייל #</th>
                    <th className="text-right py-2 px-3">נשלח</th>
                    <th className="text-right py-2 px-3">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEmails.map((email) => (
                    <tr
                      key={email.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                      onClick={() => fetchPreview(email.email, email.sequence_number)}
                    >
                      <td className="py-2 px-3 font-mono text-xs text-emerald-400 underline">
                        {email.email}
                      </td>
                      <td className="py-2 px-3">#{email.sequence_number}</td>
                      <td className="py-2 px-3 text-gray-400">
                        {new Date(email.sent_at).toLocaleString("he-IL", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2 px-3">
                        <StatusBadge status={email.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Email Preview Modal */}
        {(preview || previewLoading) && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setPreview(null)}>
            <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {previewLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                </div>
              ) : preview ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">תצוגה מקדימה</h3>
                    <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-white text-xl">✕</button>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-400">אל:</span>
                      <span className="font-mono">{preview.email}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-400">שם:</span>
                      <span>{preview.data.name || '—'} ({preview.data.firstName})</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-400">מקצוע:</span>
                      <span>{preview.data.profession}</span>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <span className="text-gray-400">מייל:</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-300">#{preview.seq}</span>
                    </div>
                    <hr className="border-gray-700" />
                    <div>
                      <div className="text-sm text-gray-400 mb-1">נושא:</div>
                      <div className="font-semibold text-white">{preview.data.subject}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400 mb-1">תוכן:</div>
                      <div className="bg-gray-800 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {preview.data.body}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color = "gray",
}: {
  label: string;
  value: number;
  icon: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    red: "text-red-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
    gray: "text-gray-300",
  };

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colorMap[color] || colorMap.gray}`}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    sent: "bg-blue-500/20 text-blue-300",
    delivered: "bg-emerald-500/20 text-emerald-300",
    opened: "bg-green-500/20 text-green-300",
    clicked: "bg-yellow-500/20 text-yellow-300",
    bounced: "bg-red-500/20 text-red-300",
    error: "bg-red-500/20 text-red-300",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs ${styles[status] || "bg-gray-700 text-gray-300"}`}
    >
      {status}
    </span>
  );
}
