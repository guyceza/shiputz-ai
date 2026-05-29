"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getSupabaseClient } from "@/lib/supabase";
import { CREDIT_COSTS } from "@/lib/credit-costs";
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  FileQuestion,
  FileText,
  MessageSquareText,
  ReceiptText,
  SearchCheck,
  Send,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";

const loadingMessages = [
  "קורא את ההצעה...",
  "משווה מחירים למדד שיפוצים...",
  "בודק סבירות לפי אזור...",
  "מחפש סעיפים חסרים...",
  "מכין סיכום...",
];

const lockedPreviewAnalysis = `סיכום
ההצעה נבדקת מול טווחי מחיר מקובלים לשיפוצים בישראל.

השוואת מחירים
- סעיף עבודה מרכזי: המחיר מושווה מול מחירון שוק
- סעיף כללי מדי: נבדק אם חסר פירוט בכמות או בחומר
- נקודת מיקוח: נבדק איפה אפשר לבקש פירוק מחיר

המלצה
הניתוח המלא נפתח אחרי הרשמה ומציג את הסעיפים שצריך לבדוק לפני חתימה.`;

const quoteOutcomeCards = [
  {
    title: "פערי מחיר",
    text: "סימון סעיפים שנראים גבוהים ביחס לטווחים מקובלים בישראל.",
    meta: "השוואת שוק",
    icon: SearchCheck,
    accent: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    title: "סעיפים חסרים",
    text: "חומרים, כמויות, אחריות ותנאי תשלום שלא כתובים מספיק ברור.",
    meta: "רשימת בדיקה",
    icon: ShieldAlert,
    accent: "border-rose-200 bg-rose-50 text-rose-900",
  },
  {
    title: "שאלות מוכנות",
    text: "נוסח קצר שאפשר לשלוח לבעל המקצוע כדי לקבל הצעה מתוקנת.",
    meta: "להעתקה",
    icon: MessageSquareText,
    accent: "border-emerald-200 bg-emerald-50 text-emerald-900",
  },
  {
    title: "דוח להורדה",
    text: "סיכום מסודר שמקל להשוות בין הצעות בלי להתבלבל מהמספרים.",
    meta: "לשמירה",
    icon: FileText,
    accent: "border-sky-200 bg-sky-50 text-sky-900",
  },
  {
    title: "נקודות מיקוח",
    text: "איפה כדאי לבקש פירוק מחיר, הסבר או חלופה זולה יותר.",
    meta: "לפני סגירה",
    icon: Calculator,
    accent: "border-stone-200 bg-stone-50 text-stone-900",
  },
  {
    title: "סיכון לפני חתימה",
    text: "איתור ניסוחים כלליים שעלולים להפוך לתוספות תשלום בהמשך.",
    meta: "אזהרות",
    icon: AlertTriangle,
    accent: "border-orange-200 bg-orange-50 text-orange-900",
  },
];

const heroProofRows = [
  {
    label: "ריצוף חדר רחצה",
    status: "מחיר גבוה",
    detail: "חסר פירוט מ״ר וסוג אריח",
    tone: "border-amber-200 bg-amber-50 text-amber-900",
  },
  {
    label: "אינסטלציה",
    status: "חסר מידע",
    detail: "לא ברור אם כולל חציבה ותיקון",
    tone: "border-rose-200 bg-rose-50 text-rose-900",
  },
  {
    label: "צבע וגמר",
    status: "לבירור",
    detail: "לא צוין מספר שכבות ואחריות",
    tone: "border-sky-200 bg-sky-50 text-sky-900",
  },
];

const heroBenefits = [
  { title: "מחיר", text: "בודקים אם הסכום סביר", icon: Calculator },
  { title: "חוסרים", text: "מזהים מה לא כתוב", icon: FileQuestion },
  { title: "תגובה", text: "מקבלים נוסח לשליחה", icon: Send },
];

function FormattedText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className={`whitespace-pre-wrap ${className}`} dir="rtl">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
}

function getGuestPreviewVerdict(text: string, hasImage: boolean): "great" | "expensive" {
  if (hasImage) return "expensive";

  const normalized = text.replace(/,/g, "");
  const numbers = Array.from(normalized.matchAll(/\d{3,7}/g))
    .map((match) => Number(match[0]))
    .filter((value) => Number.isFinite(value));

  const mentionsPainting = /צביע|צבע/.test(text);
  const mentionsRepair = /ברז|תיקון|נקודה/.test(text);
  const maxPrice = Math.max(0, ...numbers);

  if (mentionsRepair && maxPrice > 0 && maxPrice <= 700) return "great";
  if (mentionsPainting && maxPrice > 6000) return "expensive";
  if (numbers.length > 0 && maxPrice <= 1200) return "great";

  return "expensive";
}

function getVerdictLabel(verdict: string, lockedPreview: boolean) {
  if (lockedPreview) {
    return verdict === "great" ? "מציאה" : "לא מציאה";
  }

  if (verdict === "great") return "מציאה";
  if (verdict === "ok") return "מחיר סביר";
  if (verdict === "expensive") return "יקר";
  if (verdict === "very_expensive") return "יקר מדי";
  return "";
}

function buildContractorMessage(analysis: string) {
  return `שלום, עברתי על ההצעה ורוצה לבקש כמה הבהרות לפני החלטה:

1. אשמח לפירוט כמות, יחידה ומחיר לכל סעיף כללי.
2. אנא ציינו אילו חומרים כלולים, איזה מותג/רמת גמר, ומה לא כלול במחיר.
3. לגבי סעיפים שחורגים מטווח השוק, אשמח להסבר או הצעה מתוקנת.
4. נא להוסיף לוח זמנים, תנאי תשלום, אחריות ופינוי פסולת אם הם לא מופיעים.

נקודות שעלו בבדיקה:
${analysis.slice(0, 900)}`;
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function QuoteAnalysisPage() {
  const [quoteText, setQuoteText] = useState("");
  const [quoteImage, setQuoteImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [needsCredits, setNeedsCredits] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
          setIsLoggedIn(true);
        }
      } catch {} finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQuoteImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!quoteText.trim() && !quoteImage) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setVerdict(null);
    setNeedsCredits(false);
    setLoadingMsg(0);

    const msgInterval = setInterval(() => {
      setLoadingMsg((prev) => Math.min(prev + 1, loadingMessages.length - 1));
    }, 2500);

    try {
      if (!isLoggedIn) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        setDemoMode(true);
        setVerdict(getGuestPreviewVerdict(quoteText, Boolean(quoteImage)));
        setAnalysis(lockedPreviewAnalysis);
        return;
      }

      if (quoteImage) {
        // Image-based analysis
        const fd = new FormData();
        const blob = await fetch(quoteImage).then(r => r.blob());
        fd.append("image", blob, "quote.jpg");
        if (userEmail) fd.append("userEmail", userEmail);
        const res = await fetch("/api/analyze-quote", { method: "POST", body: fd });
        const data = await res.json();
        if (data.error) {
          if (data.creditError) setNeedsCredits(true);
          throw new Error(data.error);
        }
        setAnalysis(data.analysis || data.result);
        setVerdict(data.verdict || null);
      } else {
        // Text-based analysis
        const res = await fetch("/api/analyze-quote-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: quoteText, userEmail }),
        });
        const data = await res.json();
        if (data.error) {
          if (data.creditError) setNeedsCredits(true);
          throw new Error(data.error);
        }
        setAnalysis(data.analysis || data.result);
        setVerdict(data.verdict || null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בניתוח ההצעה");
    } finally {
      setAnalyzing(false);
      clearInterval(msgInterval);
    }
  };

  const reset = () => {
    setQuoteText("");
    setQuoteImage(null);
    setAnalysis(null);
    setVerdict(null);
    setError(null);
    setDemoMode(false);
    setNeedsCredits(false);
  };

  const lockedPreview = demoMode && !isLoggedIn;
  const contractorMessage = analysis ? buildContractorMessage(analysis) : "";

  const handleExportReport = () => {
    if (!analysis) return;
    const report = `דוח ניתוח הצעת מחיר - ShiputzAI
תאריך: ${new Date().toLocaleDateString("he-IL")}
סטטוס: ${verdict ? getVerdictLabel(verdict, false).trim() : "לא זמין"}

הניתוח:
${analysis}

נוסח הודעה לקבלן:
${contractorMessage}

הערה: הדוח הוא כלי עזר לקבלת כיוון לפני החלטה. מומלץ לוודא בשטח מול בעל מקצוע מוסמך.`;
    downloadTextFile(`ניתוח-הצעת-מחיר-${new Date().toLocaleDateString("he-IL")}.txt`, report);
  };

  const handleCopyContractorMessage = async () => {
    if (!contractorMessage) return;
    try {
      await navigator.clipboard.writeText(contractorMessage);
    } catch {
      downloadTextFile("נוסח-הודעה-לקבלן.txt", contractorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f4ee] text-gray-950" dir="rtl">
      <nav className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#f7f4ee]/86 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ShiputzAI" width={24} height={24} />
            <span className="text-sm font-medium text-gray-900">ShiputzAI</span>
          </Link>
          <Link href={isLoggedIn ? "/dashboard" : "/login?redirect=/quote-analysis"} className="text-sm text-gray-500 transition-colors hover:text-gray-900">
            {isLoggedIn ? "חזרה לדשבורד" : "התחברות"}
          </Link>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_18%_12%,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_78%_8%,rgba(245,158,11,0.16),transparent_34%)]" aria-hidden="true" />

        <section className="relative mx-auto max-w-6xl px-5 pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="order-2 space-y-6 text-right lg:order-1 lg:pt-4">
              <div>
                <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal text-gray-950 md:text-6xl">
                  הצעת המחיר נראית טוב?
                </h1>
                <p className="mt-5 max-w-xl text-lg leading-8 text-gray-600">
                  העלו הצעה מבעל מקצוע או כתבו את הסעיפים. תקבלו כיוון ברור, סימון חריגות ושאלות שאפשר להחזיר לפני החלטה.
                </p>
              </div>

              <div className="hidden rounded-[28px] border border-stone-200 bg-white p-5 shadow-xl shadow-stone-300/30 lg:block">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-400">תצוגת דוח לדוגמה</p>
                    <h2 className="mt-1 text-xl font-black text-gray-950">מה הדוח תופס עבורכם</h2>
                  </div>
                  <ReceiptText className="h-8 w-8 text-emerald-700" />
                </div>
                <div className="space-y-3">
                  {heroProofRows.map((row) => (
                    <div key={row.label} className="rounded-2xl border border-stone-100 bg-stone-50/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-gray-950">{row.label}</span>
                        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${row.tone}`}>{row.status}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-gray-500">{row.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="order-1 rounded-[30px] border border-stone-200 bg-white p-4 shadow-2xl shadow-stone-300/35 sm:p-6 lg:order-2">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">ניתוח הצעה</p>
                  <h2 className="mt-1 text-2xl font-black text-gray-950">הכניסו הצעה לבדיקה</h2>
                </div>
                <div className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                  {isLoggedIn ? `${CREDIT_COSTS["analyze-quote"]} קרדיטים` : "דוגמה חינם"}
                </div>
              </div>

              {checkingAuth && !analysis && !analyzing && !error && (
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center text-sm text-gray-500">
                  בודק התחברות...
                </div>
              )}

              {!checkingAuth && !isLoggedIn && !analysis && !analyzing && !error && (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-right">
                  <p className="mb-1 text-sm font-semibold text-emerald-800">אפשר לראות דוגמה בלי להתחבר</p>
                  <p className="text-sm leading-6 text-emerald-900/80">
                    כתבו כמה סעיפים מהצעת מחיר או העלו צילום. תקבלו תשובה ראשונית גלויה, ואת הניתוח המלא נפתח אחרי הרשמה.
                  </p>
                </div>
              )}

              {!checkingAuth && !analysis && !analyzing && !error && (
                <div className="space-y-5">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-3xl border border-dashed p-6 text-center transition-all ${
                      quoteImage ? "border-gray-900 bg-gray-50" : "border-stone-300 bg-stone-50/80 hover:border-gray-500 hover:bg-white"
                    }`}
                  >
                    {quoteImage ? (
                      <div className="space-y-3">
                        <img src={quoteImage} alt="הצעת מחיר" className="mx-auto max-h-64 rounded-2xl" />
                        <p className="text-sm text-gray-500">לחץ להחלפת תמונה</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-600 shadow-sm">
                          <UploadCloud className="h-6 w-6" />
                        </div>
                        <p className="font-semibold text-gray-900">העלו תמונה של הצעת המחיר</p>
                        <p className="text-sm text-gray-400">צילום מהטלפון או סקרינשוט</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {heroBenefits.map((benefit) => {
                      const Icon = benefit.icon;
                      return (
                        <div key={benefit.title} className="rounded-2xl border border-stone-200 bg-white p-3 text-center shadow-sm">
                          <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
                            <Icon className="h-4 w-4" />
                          </div>
                          <h2 className="text-sm font-bold text-gray-950">{benefit.title}</h2>
                          <p className="mt-1 text-xs leading-5 text-gray-500">{benefit.text}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-sm text-gray-400">או כתבו ידנית</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>

                  <textarea
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder={"לדוגמה:\nצביעת דירת 4 חדרים - 8,000 ש״ח\nהחלפת ברז במטבח - 450 ש״ח\nהתקנת מזגן כולל נקודה - 2,500 ש״ח"}
                    className="h-40 w-full resize-none rounded-3xl border border-stone-200 bg-stone-50/80 p-5 text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gray-900"
                    dir="rtl"
                  />

                  <button
                    onClick={handleAnalyze}
                    disabled={!quoteText.trim() && !quoteImage}
                    className="mx-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-lg font-semibold text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isLoggedIn ? "נתח הצעה" : "בדקו אם זו מציאה"}
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <p className="text-center text-xs text-gray-400">
                    {isLoggedIn ? `${CREDIT_COSTS["analyze-quote"]} קרדיטים לבדיקה` : "הוורדיקט גלוי · הניתוח המלא אחרי הרשמה"}
                  </p>
                </div>
              )}

              {analyzing && (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
                  <p className="mb-2 text-lg font-medium text-gray-900">{loadingMessages[loadingMsg]}</p>
                  <p className="text-sm text-gray-400">זה לוקח כ-15 שניות</p>
                </div>
              )}

              {error && !analyzing && (
                <div className="flex flex-col items-center py-16 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                    <AlertTriangle className="h-7 w-7 text-amber-600" />
                  </div>
                  <p className="mb-2 text-lg font-medium text-gray-900">לא הצלחנו לנתח את ההצעה</p>
                  <p className="mb-6 text-sm text-gray-500">{error}</p>
                  {needsCredits ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link href="/pricing" className="rounded-full bg-gray-900 px-8 py-3 font-medium text-white hover:bg-gray-800">
                        רכישת קרדיטים
                      </Link>
                      <button onClick={reset} className="rounded-full bg-gray-100 px-8 py-3 font-medium text-gray-900 hover:bg-gray-200">
                        נסה הצעה אחרת
                      </button>
                    </div>
                  ) : (
                    <button onClick={reset} className="rounded-full bg-gray-900 px-8 py-3 font-medium text-white hover:bg-gray-800">
                      נסה שוב
                    </button>
                  )}
                </div>
              )}

              {analysis && !analyzing && !error && (
                <div className="space-y-5">
                  {verdict && (
                    <div className={`rounded-3xl p-6 text-center ${
                      verdict === "great" ? "border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50" :
                      verdict === "ok" ? "border border-blue-200 bg-gradient-to-br from-blue-50 to-sky-50" :
                      verdict === "expensive" ? "border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50" :
                      "border border-red-200 bg-gradient-to-br from-red-50 to-rose-50"
                    }`}>
                      <div className={`mb-1 text-3xl font-black ${
                        verdict === "great" ? "text-green-700" :
                        verdict === "ok" ? "text-blue-700" :
                        verdict === "expensive" ? "text-orange-700" :
                        "text-red-700"
                      }`}>
                        {getVerdictLabel(verdict, lockedPreview)}
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
                    <h3 className="mb-3 font-semibold text-gray-900">{lockedPreview ? "הניתוח המלא נעול" : demoMode ? "דוגמת ניתוח" : "סיכום הניתוח"}</h3>
                    <div className="relative">
                      <FormattedText
                        text={analysis}
                        className={`leading-relaxed text-gray-700 ${lockedPreview ? "select-none blur-[5px]" : ""}`}
                      />
                      {lockedPreview && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/55 px-4 text-center backdrop-blur-[1px]">
                          <div className="max-w-sm rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm">
                            <p className="mb-3 text-sm font-semibold text-gray-950">הוורדיקט כבר גלוי. הפירוט המלא אחרי הרשמה.</p>
                            <p className="mb-4 text-xs leading-5 text-gray-500">
                              פתחו את הסעיפים, החריגות ונקודות המיקוח. אם אין מספיק קרדיטים, נעביר אתכם לרכישה.
                            </p>
                            <Link href="/signup?redirect=/quote-analysis" className="inline-flex w-full justify-center rounded-full bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                              הרשמה ופתיחת הניתוח
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {!lockedPreview && (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                      <h3 className="mb-2 font-semibold text-amber-950">דוח משא ומתן לבעל המקצוע</h3>
                      <p className="text-sm leading-6 text-amber-900/80">
                        הניתוח בנוי כדי להחזיר שאלות מדויקות: סעיפים כלליים מדי, מחירים חריגים, חסרים בהצעה ומה לבקש בגרסה מתוקנת.
                      </p>
                      <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-white/70 p-4 text-sm leading-6 text-gray-700">
                        {contractorMessage}
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button onClick={handleCopyContractorMessage} className="flex-1 rounded-full bg-amber-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-800">
                          העתק הודעה
                        </button>
                        <button onClick={handleExportReport} className="flex-1 rounded-full border border-amber-300 bg-white px-5 py-3 text-sm font-medium text-amber-950 transition-colors hover:bg-amber-100">
                          הורדת דוח טקסט
                        </button>
                      </div>
                    </div>
                  )}

                  {demoMode && !lockedPreview && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center">
                      <p className="mb-4 text-sm leading-6 text-gray-600">
                        רוצים שה-AI יבדוק את ההצעה האמיתית שלכם ויחזיר סעיפים חסרים, חריגות מחיר ונקודות מיקוח?
                      </p>
                      <Link href="/signup?redirect=/quote-analysis" className="inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800">
                        התחברו לניתוח אמיתי
                      </Link>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button onClick={reset} className="flex-1 rounded-full bg-gray-900 py-3.5 font-medium text-white transition-all hover:bg-gray-800">
                      נתח הצעה נוספת
                    </button>
                    {!demoMode && (
                      <Link href="/dashboard" className="flex-1 rounded-full bg-gray-100 py-3.5 text-center font-medium text-gray-900 transition-all hover:bg-gray-200">
                        חזרה לדשבורד
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {!analysis && !analyzing && !error && (
          <section className="relative border-y border-stone-200 bg-[#fbfaf7] px-4 py-10" aria-label="מה מקבלים בניתוח הצעה">
            <div className="mx-auto max-w-6xl">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-emerald-700">תוצרים מהבדיקה</p>
                  <h2 className="text-2xl font-black text-gray-950 md:text-3xl">מה יוצא מהניתוח?</h2>
                </div>
                <CheckCircle2 className="hidden h-7 w-7 text-emerald-600 sm:block" />
              </div>
              <div className="quote-outcomes-marquee overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
                <div className="quote-outcomes-track flex w-max gap-4">
                  {[...quoteOutcomeCards, ...quoteOutcomeCards].map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <div key={`${card.title}-${index}`} className="w-[282px] shrink-0 rounded-[24px] border border-stone-200 bg-white p-5 text-right shadow-sm">
                        <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${card.accent}`}>
                          <Icon className="h-4 w-4" />
                          {card.meta}
                        </div>
                        <h3 className="text-lg font-black text-gray-950">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-500">{card.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <style>{`
              .quote-outcomes-track { animation: quote-outcomes-scroll 34s linear infinite; }
              .quote-outcomes-marquee:hover .quote-outcomes-track { animation-play-state: paused; }
              @media (prefers-reduced-motion: reduce) {
                .quote-outcomes-track { animation: none; }
              }
              @keyframes quote-outcomes-scroll {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }
            `}</style>
          </section>
        )}
      </main>
    </div>
  );
}
