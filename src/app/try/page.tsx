"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

// ── animations ──────────────────────────────────────────────
const ANIM_CSS = `
@keyframes bounce-in {
  0%{transform:scale(.8);opacity:0}
  50%{transform:scale(1.05)}
  100%{transform:scale(1);opacity:1}
}
@keyframes shimmer {
  0%{transform:translateX(-100%)}
  100%{transform:translateX(100%)}
}
@keyframes pulse-glow {
  0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.45)}
  50%{box-shadow:0 0 20px 6px rgba(16,185,129,.25)}
}
@keyframes slide-reveal {
  0%{clip-path:inset(0 100% 0 0)}
  50%{clip-path:inset(0 0 0 0)}
  100%{clip-path:inset(0 100% 0 0)}
}
@keyframes float-badge {
  0%,100%{transform:translateY(0)}
  50%{transform:translateY(-6px)}
}
@keyframes pulse-arrow {
  0%,100%{opacity:.4;transform:translateX(0)}
  50%{opacity:1;transform:translateX(-4px)}
}
.animate-bounce-in{animation:bounce-in .4s ease-out}
.animate-shimmer{animation:shimmer 1.5s ease-in-out infinite}
.animate-pulse-glow{animation:pulse-glow 2s ease-in-out infinite}
.animate-slide-reveal{animation:slide-reveal 6s ease-in-out infinite}
.animate-float-badge{animation:float-badge 3s ease-in-out infinite}
.animate-pulse-arrow{animation:pulse-arrow 1.5s ease-in-out infinite}
`;

// ── loading tips (shown while Gemini works) ─────────────────
const TIPS = [
  "💡 קבל לפחות 3 הצעות מחיר לפני שמתחילים",
  "📋 תעד הכל בכתב — זה יחסוך כאבי ראש",
  "🔍 בדוק המלצות על קבלנים לפני שסוגרים",
  "💰 השאר 15% מהתקציב לבלת״מים",
  "📅 שיפוץ תמיד לוקח יותר זמן מהצפוי",
  "🏠 צלם את המצב הקיים לפני שמתחילים",
  "⚡ החשמל והאינסטלציה — לא חוסכים עליהם",
  "🎨 צבעים ניטרליים — קל לשנות אחר כך",
  "📦 הזמן חומרים מראש — יש עיכובים באספקה",
  "✅ בדוק שהקבלן מבוטח ורשום",
];

// ── page ─────────────────────────────────────────────────────
export default function TryPage() {
  // ── state ──────────────────────────────────────────────────
  const [guestUsed, setGuestUsed] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    image: string;
    analysis: string;
    costs: any;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [tipIdx, setTipIdx] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── init: check localStorage + cookie ──────────────────────
  useEffect(() => {
    try {
      if (
        localStorage.getItem("shiputz_guest_trial") === "true" ||
        document.cookie.includes("shiputz_guest_trial=true")
      ) {
        setGuestUsed(true);
      }
    } catch {}
  }, []);

  // ── countdown + tip rotation while generating ─────────────
  useEffect(() => {
    if (!generating) {
      setCountdown(60);
      setTipIdx(0);
      return;
    }
    const cd = setInterval(() => setCountdown((p) => Math.max(0, p - 1)), 1000);
    const tp = setInterval(() => setTipIdx((p) => (p + 1) % TIPS.length), 3500);
    return () => {
      clearInterval(cd);
      clearInterval(tp);
    };
  }, [generating]);

  // ── scroll to result when ready ────────────────────────────
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // ── image handling ─────────────────────────────────────────
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("יש להעלות קובץ תמונה בלבד");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("התמונה גדולה מדי. גודל מקסימלי: 10MB");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setUploadedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  };

  // ── generate ───────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!uploadedImage || !description) return;
    setGenerating(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/visualize-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: uploadedImage, description }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else if (data.generatedImage) {
        setResult({
          image: data.generatedImage,
          analysis: data.analysis || "",
          costs: data.costs,
        });
        try {
          localStorage.setItem("shiputz_guest_trial", "true");
        } catch {}
        setGuestUsed(true);
      } else if (data.message) {
        setError(data.message);
      } else {
        setError("שגיאה לא צפויה. נסה שוב.");
      }
    } catch {
      setError(
        "שגיאה בחיבור לשרת. ייתכן שיש אנשים בתמונה — נסה תמונה ללא אנשים."
      );
    }
    setGenerating(false);
  };

  // ── reset (start over — only matters if we allow it) ──────
  const handleReset = () => {
    setUploadedImage(null);
    setDescription("");
    setResult(null);
    setError("");
  };

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {/* ── nav ─────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">
              ✨ ניסיון חינמי
            </span>
            <Link
              href="/login"
              className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all"
            >
              התחברות
            </Link>
          </div>
        </div>
      </nav>

      {/* ── hero ────────────────────────────────────────────── */}
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full mb-6 text-sm font-medium">
            ללא הרשמה · ללא כרטיס אשראי
          </div>

          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight mb-4 text-gray-900">
            ראה את השיפוץ שלך
            <br />
            <span className="text-emerald-600">לפני שמתחיל.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
            העלה תמונה של החדר, תאר מה אתה רוצה לשנות, וה-AI יראה לך
            את התוצאה הסופית עם הערכת עלויות.
          </p>

          {/* mini before/after teaser */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 mb-6 max-w-2xl mx-auto">
            <div className="relative aspect-[16/9]">
              <img
                src="/before-room.jpg"
                alt="לפני"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 animate-slide-reveal">
                <img
                  src="/after-room.jpg"
                  alt="אחרי"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow">
                  📷 לפני
                </span>
              </div>
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow animate-float-badge">
                  ✨ אחרי
                </span>
              </div>
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* ── main card ──────────────────────────────────────── */}
      <section className="px-6 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* ── IF guest already used & no result showing: signup wall ── */}
          {guestUsed && !result ? (
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center animate-bounce-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                אהבת? יש עוד!
              </h2>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                השתמשת בניסיון החינמי. הירשם בחינם וקבל גישה להדמיות נוספות,
                שמירת היסטוריה, הערכת עלויות ועוד.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup?redirect=/visualize"
                  className="bg-gray-900 text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-gray-800 transition-all shadow-lg animate-pulse-glow"
                >
                  🎉 הירשם בחינם
                </Link>
                <Link
                  href="/login?redirect=/visualize"
                  className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-full text-base font-medium hover:bg-gray-50 transition-all"
                >
                  יש לי כבר חשבון
                </Link>
              </div>
              <Link
                href="/visualize"
                className="inline-block mt-6 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← חזרה לדף ההדמיות
              </Link>
            </div>
          ) : !result ? (
            /* ── upload + describe form ────────────────────── */
            <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  ✨ ניסיון חינמי
                </h2>
                <p className="text-sm text-gray-400">
                  העלה תמונה ← תאר שינוי ← קבל הדמיה + עלויות
                </p>
              </div>

              {/* image upload */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📸 תמונת החדר
                </label>
                {!uploadedImage ? (
                  <label
                    className="block cursor-pointer"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                    }}
                    onDrop={onDrop}
                  >
                    <div
                      className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                        isDragOver
                          ? "border-emerald-500 bg-emerald-50 scale-[1.02]"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      <div className="text-4xl mb-3">
                        {isDragOver ? "📥" : "📸"}
                      </div>
                      <p className="text-gray-600 font-medium">
                        {isDragOver
                          ? "שחרר כאן!"
                          : "לחץ או גרור תמונה לכאן"}
                      </p>
                      <p className="text-gray-400 text-xs mt-2">
                        ללא אנשים בתמונה · עד 10MB
                      </p>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="לפני"
                      className="w-full rounded-2xl max-h-64 object-cover"
                    />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      ✕
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      לפני
                    </span>
                  </div>
                )}
              </div>

              {/* description */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ✏️ מה לשנות?
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder='למשל: "רוצה פרקט במקום אריחים, קירות אפורים, תאורה שקועה"'
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none h-24 text-sm"
                />
              </div>

              {/* error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* loading state */}
              {generating && (
                <div className="mb-4 p-5 bg-gray-50 rounded-xl text-center">
                  <div className="text-4xl mb-3 animate-bounce">🏠</div>
                  <div className="text-lg font-bold text-gray-900 mb-1">
                    {countdown > 0
                      ? `יוצר הדמיה... ${countdown} שניות`
                      : "לוקח קצת יותר זמן מהרגיל..."}
                  </div>
                  <div className="text-sm text-gray-500 min-h-[32px] flex items-center justify-center">
                    {TIPS[tipIdx]}
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.max(5, 100 - (countdown / 60) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* generate button */}
              <button
                onClick={handleGenerate}
                disabled={!uploadedImage || !description || generating}
                className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    יוצר הדמיה...
                  </span>
                ) : (
                  "🪄 צור הדמיה בחינם"
                )}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                ניסיון אחד חינם · ללא הרשמה · ללא כרטיס אשראי
              </p>
            </div>
          ) : null}

          {/* ── result ─────────────────────────────────────── */}
          {result && (
            <div
              ref={resultRef}
              className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-xl animate-bounce-in"
            >
              <div className="text-center mb-5">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  🎉 ההדמיה שלך מוכנה!
                </h2>
              </div>

              {/* before / after */}
              <div className="grid md:grid-cols-2 gap-3 mb-5">
                <div className="relative">
                  <img
                    src={uploadedImage || ""}
                    alt="לפני"
                    className="w-full rounded-2xl"
                  />
                  <span className="absolute top-3 right-3 bg-gray-900 text-white text-xs px-3 py-1 rounded-full">
                    לפני
                  </span>
                </div>
                <div className="relative">
                  <img
                    src={result.image}
                    alt="אחרי"
                    className="w-full rounded-2xl"
                  />
                  <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-3 py-1 rounded-full">
                    אחרי ✨
                  </span>
                </div>
              </div>

              {/* analysis */}
              {result.analysis && (
                <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                    📝 ניתוח מקצועי
                  </h4>
                  <div className="text-gray-700 text-sm leading-relaxed space-y-2">
                    {result.analysis
                      .split("\n\n")
                      .map((p, i) => (
                        <p key={i}>
                          {p
                            .replace(/\*\*/g, "")
                            .replace(/\n/g, " ")
                            .trim()}
                        </p>
                      ))}
                  </div>
                </div>
              )}

              {/* costs */}
              {result.costs?.total > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                    💰 הערכת עלויות
                  </h4>
                  <div className="space-y-2">
                    {result.costs.items?.map(
                      (item: any, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {item.description}
                          </span>
                          <span className="font-medium">
                            ₪{item.total?.toLocaleString()}
                          </span>
                        </div>
                      )
                    )}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                      <span>סה״כ משוער</span>
                      <span className="text-emerald-600">
                        ₪{result.costs.total?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* download */}
              <a
                href={result.image}
                download="shiputzai-visualization.png"
                className="block w-full bg-gray-900 text-white py-3 rounded-full text-center font-medium hover:bg-gray-800 transition-all mb-4"
              >
                📥 הורד תמונה
              </a>

              {/* signup CTA */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  🎉 אהבת? יש עוד!
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  הירשם בחינם וקבל גישה להדמיות נוספות, שמירת היסטוריה,
                  הערכת עלויות מפורטת ו-Shop the Look.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/signup?redirect=/visualize"
                    className="bg-gray-900 text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-gray-800 transition-all shadow-lg animate-pulse-glow"
                  >
                    🎉 הירשם בחינם
                  </Link>
                  <Link
                    href="/login?redirect=/visualize"
                    className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-full text-base font-medium hover:bg-gray-50 transition-all"
                  >
                    יש לי כבר חשבון
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── how it works ───────────────────────────────────── */}
      {!result && !guestUsed && (
        <section className="py-16 px-6 bg-gray-50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-10 text-center">
              איך זה עובד?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {[
                {
                  num: "1",
                  icon: "📸",
                  title: "צלם את החדר",
                  desc: "העלה תמונה של החדר שאתה רוצה לשפץ",
                },
                {
                  num: "2",
                  icon: "✏️",
                  title: "תאר שינויים",
                  desc: '"רוצה פרקט, קירות אפורים, תאורה שקועה"',
                },
                {
                  num: "3",
                  icon: "✨",
                  title: "קבל הדמיה + עלויות",
                  desc: "תוך שניות — תמונה של התוצאה + הערכת מחיר",
                },
              ].map((step) => (
                <div key={step.num}>
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-gray-100 text-2xl">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── social proof ───────────────────────────────────── */}
      {!result && !guestUsed && (
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-3">
              <span className="text-green-500">✓</span> תמונה תוך שניות
              <span className="mx-2">·</span>
              <span className="text-green-500">✓</span> הערכת עלויות מדויקת
              <span className="mx-2">·</span>
              <span className="text-green-500">✓</span> מבוסס מחירי שוק
            </div>
            <p className="text-xs text-gray-400">
              כבר אלפי משפצים משתמשים ב-ShiputzAI לתכנון השיפוץ שלהם
            </p>
          </div>
        </section>
      )}

      {/* ── footer ─────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/visualize" className="hover:text-gray-900">
              כל ההדמיות
            </Link>
            <Link href="/terms" className="hover:text-gray-900">
              תנאי שימוש
            </Link>
            <Link href="/privacy" className="hover:text-gray-900">
              פרטיות
            </Link>
            <Link href="/" className="hover:text-gray-900">
              דף הבית
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
