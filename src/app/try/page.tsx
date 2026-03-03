"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import FlappyBirdGame from "@/components/FlappyBirdGame";

// Dynamic import for Lottie (client-side only)
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const POPCORN_ANIMATION_URL = '/popcorn-waiting.json';

// ── animations ──────────────────────────────────────────────
const ANIM_CSS = `
@keyframes bounce-in {
  0%{transform:scale(.8);opacity:0}
  50%{transform:scale(1.05)}
  100%{transform:scale(1);opacity:1}
}
@keyframes progress-bar {
  0% { width: 0%; }
  100% { width: 100%; }
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
@keyframes shop-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
.animate-bounce-in{animation:bounce-in .4s ease-out}
.animate-progress-bar{animation:progress-bar 2s ease-in-out}
.animate-shimmer{animation:shimmer 1.5s ease-in-out infinite}
.animate-pulse-glow{animation:pulse-glow 2s ease-in-out infinite}
.animate-slide-reveal{animation:slide-reveal 6s ease-in-out infinite}
.animate-float-badge{animation:float-badge 3s ease-in-out infinite}
.animate-pulse-arrow{animation:pulse-arrow 1.5s ease-in-out infinite}
.animate-shop-pulse{animation:shop-pulse 2s ease-in-out infinite}
`;

// ── examples data ───────────────────────────────────────────
interface ExampleCard {
  id: number;
  title: string;
  beforeImg: string;
  afterImg: string;
  changes: string;
  costs: { item: string; price: number }[];
  total: number;
}

const EXAMPLES: ExampleCard[] = [
  {
    id: 1,
    title: "סלון מודרני",
    beforeImg: "/before-room.jpg",
    afterImg: "/after-room.jpg",
    changes: "ריהוט מודרני חדש, תאורת LED, תמונות דקורטיביות, שטיח גיאומטרי",
    costs: [
      { item: "פרקט עץ אלון (25 מ״ר)", price: 6250 },
      { item: "תאורה שקועה (8 ספוטים)", price: 2400 },
      { item: "צביעה (60 מ״ר)", price: 2400 },
      { item: "עבודה", price: 4500 },
    ],
    total: 15550,
  },
  {
    id: 2,
    title: "מטבח כפרי",
    beforeImg: "/examples/kitchen-before.jpg",
    afterImg: "/examples/kitchen-after.jpg",
    changes: "ארונות עץ אלון כהה, משטח קוורץ לבן, חיפוי אבן טבעית, מנורות ראטן",
    costs: [
      { item: "חזיתות עץ אלון (4 מטר)", price: 8000 },
      { item: "משטח שיש קיסר", price: 4500 },
      { item: "חיפוי קרמיקה (3 מ״ר)", price: 1800 },
      { item: "עבודה והתקנה", price: 3500 },
    ],
    total: 17800,
  },
  {
    id: 3,
    title: "חדר שינה מינימליסטי",
    beforeImg: "/examples/bedroom-before.jpg",
    afterImg: "/examples/bedroom-after.jpg",
    changes: "ארון הזזה לבן עם מראה, מיטה זוגית מרופדת, פרקט אלון, תאורה שקועה",
    costs: [
      { item: "ארון הזזה עם מראה (3 מטר)", price: 9500 },
      { item: "פרקט אלון (15 מ״ר)", price: 3750 },
      { item: "תאורה שקועה (6 ספוטים)", price: 1800 },
      { item: "צביעה אפור (45 מ״ר)", price: 1800 },
      { item: "עבודה", price: 3500 },
    ],
    total: 20350,
  },
];

// ── loading tips ────────────────────────────────────────────
const LOADING_TIPS = [
  "💡 קבל לפחות 3 הצעות מחיר לפני שמתחילים",
  "📋 תעד הכל בכתב — זה יחסוך כאבי ראש",
  "🔍 בדוק המלצות על קבלנים לפני שסוגרים",
  "💰 השאר 15% מהתקציב לבלת״מים",
  "📅 שיפוץ תמיד לוקח יותר זמן מהצפוי",
  "🏠 צלם את המצב הקיים לפני שמתחילים",
  "⚡ החשמל והאינסטלציה — לא חוסכים עליהם",
  "🎨 בחר צבעים ניטרליים — קל לשנות אחר כך",
  "📦 הזמן חומרים מראש — יש עיכובים באספקה",
  "✅ בדוק שהקבלן מבוטח ורשום",
];

// ── BeforeAfterSlider ───────────────────────────────────────
function BeforeAfterSlider({ beforeImg, afterImg }: { beforeImg: string; afterImg: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 select-none touch-none"
      onMouseMove={(e) => { if (isDragging) handleMove(e.clientX); }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={(e) => { if (isDragging) handleMove(e.touches[0].clientX); }}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* After image (LEFT side) */}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
        <img src={afterImg} alt="אחרי" className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs px-2 py-1 rounded">אחרי</div>
      </div>
      {/* Before image (RIGHT side) */}
      <div className="absolute inset-0 pointer-events-none" style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}>
        <img src={beforeImg} alt="לפני" className="w-full h-full object-cover" />
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">לפני</div>
      </div>
      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-6 cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-lg -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-gray-400">↔</span>
        </div>
      </div>
    </div>
  );
}

// ── ExampleCard ─────────────────────────────────────────────
function ExampleCardComponent({ example }: { example: ExampleCard }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300">
      <BeforeAfterSlider beforeImg={example.beforeImg} afterImg={example.afterImg} />
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{example.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{example.changes}</p>
        <button onClick={() => setShowDetails(!showDetails)} className="text-sm text-gray-900 hover:text-gray-600 font-medium">
          {showDetails ? "הסתר פירוט עלויות ↑" : "הצג פירוט עלויות ↓"}
        </button>
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-bounce-in">
            <div className="space-y-2">
              {example.costs.map((cost, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cost.item}</span>
                  <span className="text-gray-900">₪{cost.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 font-semibold">
              <span className="text-gray-900">סה״כ משוער</span>
              <span className="text-gray-900">₪{example.total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN PAGE — Guest Trial
// ══════════════════════════════════════════════════════════════
export default function TryPage() {
  // ── state ──────────────────────────────────────────────────
  const [guestUsed, setGuestUsed] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showGameLoading, setShowGameLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    image: string;
    analysis: string;
    costs: any;
  } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [tipIdx, setTipIdx] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [waitingAnimationData, setWaitingAnimationData] = useState<object | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ── init: check localStorage + cookie ─────────────────────
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

  // ── load popcorn animation ────────────────────────────────
  useEffect(() => {
    fetch(POPCORN_ANIMATION_URL)
      .then(res => res.json())
      .then(data => setWaitingAnimationData(data))
      .catch(err => console.error('Failed to load waiting animation:', err));
  }, []);

  // ── countdown + tip rotation while generating ─────────────
  useEffect(() => {
    if (!generating) {
      setCountdown(60);
      setTipIdx(0);
      return;
    }
    const cd = setInterval(() => setCountdown((p) => Math.max(0, p - 1)), 1000);
    const tp = setInterval(() => setTipIdx((p) => (p + 1) % LOADING_TIPS.length), 3000);
    return () => { clearInterval(cd); clearInterval(tp); };
  }, [generating]);

  // ── scroll to result when ready ───────────────────────────
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // ── image handling ────────────────────────────────────────
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

  // ── try now handler ───────────────────────────────────────
  const handleTryNow = () => {
    if (guestUsed) return; // shouldn't happen, button hidden
    setShowUploadModal(true);
  };

  // ── generate ──────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!uploadedImage || !description) return;
    setGenerating(true);
    setShowGameLoading(true);
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
      setError("שגיאה בחיבור לשרת. ייתכן שיש אנשים בתמונה — נסה תמונה ללא אנשים.");
    }
    setGenerating(false);
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: ANIM_CSS }} />

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">🎨 AI Vision</span>
            <Link href="/tips" className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all">מאמרים וטיפים</Link>
            <Link href="/login" className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all">התחברות</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ───────────────────────────────────── */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-gray-100 px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-medium text-gray-700">חדש! ראה איך השיפוץ שלך יראה</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-gray-900">
            ראה את השיפוץ<br />
            <span className="text-gray-900">לפני שמתחיל.</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            העלו תמונה של החדר, תאר מה אתה רוצה לשנות, וה-AI ייצור לך תמונה של התוצאה הסופית עם הערכת עלויות מדויקת.
          </p>

          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1"><span className="text-green-500">✓</span> תמונה תוך שניות</span>
            <span className="flex items-center gap-1"><span className="text-green-500">✓</span> הערכת עלויות מדויקת</span>
            <span className="flex items-center gap-1"><span className="text-green-500">✓</span> ללא הרשמה</span>
          </div>

          {/* Before → After Label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-lg font-bold text-gray-400">לפני</span>
            <span className="animate-pulse-arrow text-2xl text-emerald-500">←</span>
            <span className="text-lg font-bold text-emerald-600">אחרי ✨</span>
          </div>

          {/* Full Width Before/After */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 mb-10">
            <div className="relative aspect-[4/3]">
              <img src="/before-room.jpg" alt="לפני השיפוץ" className="w-full h-full object-cover" />
              <div className="absolute inset-0 animate-slide-reveal">
                <img src="/after-room.jpg" alt="אחרי השיפוץ" className="w-full h-full object-cover" />
              </div>
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-sm font-bold px-4 py-2 rounded-full shadow-lg">📷 לפני</span>
              </div>
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-float-badge">✨ אחרי</span>
              </div>
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 z-10" />
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3">
            {guestUsed ? (
              <>
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center animate-bounce-in max-w-md">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">אהבת? יש עוד!</h2>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    השתמשת בניסיון החינמי. הירשם בחינם וקבל גישה להדמיות נוספות, שמירת היסטוריה, הערכת עלויות ועוד.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/signup?redirect=/visualize" className="bg-gray-900 text-white px-8 py-3.5 rounded-full text-base font-medium hover:bg-gray-800 transition-all shadow-lg animate-pulse-glow">
                      🎉 הירשם בחינם
                    </Link>
                    <Link href="/login?redirect=/visualize" className="border border-gray-300 text-gray-700 px-8 py-3.5 rounded-full text-base font-medium hover:bg-gray-50 transition-all">
                      יש לי כבר חשבון
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleTryNow}
                  className="bg-gray-900 text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  ✨ נסו עכשיו בחינם
                </button>
                <p className="text-sm text-gray-400">ניסיון אחד חינם · ללא הרשמה · ללא כרטיס אשראי</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Examples Section ──────────────────────────────── */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">ראה איך זה עובד</h2>
            <p className="text-gray-500">דוגמאות אמיתיות של חדרים שעברו הדמיה</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {EXAMPLES.map((example) => (
              <ExampleCardComponent key={example.id} example={example} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo Video ───────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">ראה איך זה עובד בפועל</h2>
            <p className="text-gray-500">צפו בהדגמה קצרה של התהליך</p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <video
              autoPlay loop muted playsInline preload="metadata"
              className="w-full cursor-pointer"
              poster="/demo-video-poster.jpg"
              onClick={(e) => {
                const video = e.currentTarget;
                if (video.paused) video.play(); else video.pause();
              }}
            >
              <source src="/demo-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">איך זה עובד?</h2>
          </div>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-gray-900">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">צלם את החדר</h3>
                <p className="text-gray-500">העלו תמונה של החדר שאתה רוצה לשפץ. עובד עם כל חדר - סלון, מטבח, חדר שינה, חדר רחצה.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-gray-900">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">תאר את השינויים</h3>
                <p className="text-gray-500">&quot;רוצה פרקט במקום אריחים, תאורה שקועה, וצבע אפור-כחול&quot; - פשוט ככה.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-white">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">קבל הדמיה + עלויות</h3>
                <p className="text-gray-500">תוך שניות תקבל תמונה של התוצאה הסופית, עם פירוט מדויק של העלויות הצפויות.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">שאלות נפוצות</h2>
          </div>
          <div className="space-y-6">
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה מדויקת הערכת העלויות?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">ההערכות מבוססות על מחירי שוק מעודכנים ומדויקות ל-±15%. המערכת לוקחת בחשבון את סוג העבודה, חומרים, ואזור גיאוגרפי.</p>
            </details>
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה הדמיות אפשר ליצור?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">הניסיון החינמי כולל הדמיה אחת. לאחר הרשמה חינמית, תוכלו ליצור הדמיות נוספות.</p>
            </details>
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                האם צריך להירשם?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">לא! הניסיון הראשון לא דורש הרשמה. פשוט העלו תמונה ותקבלו הדמיה מיידית. לאחר מכן, הרשמה חינמית פותחת גישה להדמיות נוספות, שמירת היסטוריה ועוד.</p>
            </details>
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                האם זה עובד עם כל סוג של חדר?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">כן! המערכת עובדת עם כל סוג חדר - סלון, מטבח, חדר שינה, חדר רחצה, מרפסת, ועוד. מומלץ לצלם תמונה ברורה עם תאורה טובה.</p>
            </details>
          </div>
        </div>
      </section>

      {/* ── CTA Bottom ───────────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">מוכן לראות את השיפוץ שלך?</h2>
          <p className="text-gray-400 mb-8">הצטרף לאלפי משפצים שכבר משתמשים בשירות ההדמיה</p>
          <div className="flex gap-4 flex-wrap justify-center">
            {!guestUsed ? (
              <button onClick={handleTryNow} className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors">
                ✨ נסו עכשיו בחינם
              </button>
            ) : (
              <Link href="/signup?redirect=/visualize" className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors">
                🎉 הירשם בחינם
              </Link>
            )}
            <Link href="/login" className="text-white px-8 py-4 rounded-full text-base border border-gray-700 hover:bg-gray-800 transition-colors">
              יש לי כבר חשבון
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-gray-900">פרטיות</Link>
            <Link href="/" className="hover:text-gray-900">דף הבית</Link>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════
          MODALS
          ═══════════════════════════════════════════════════════ */}

      {/* ── Upload Modal ─────────────────────────────────── */}
      {showUploadModal && (!result || showGameLoading) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative">
            <button
              onClick={() => { setShowUploadModal(false); setUploadedImage(null); setDescription(""); }}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">✨ נסו בחינם — הדמיה אחת עלינו!</h3>
              <p className="text-gray-500">העלו תמונה של החדר ותאר מה אתה רוצה לשנות</p>
              <p className="text-amber-600 text-sm mt-1">💡 טיפ: העלו תמונה ללא אנשים לתוצאות טובות יותר</p>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונת החדר (לפני)</label>
              {!uploadedImage ? (
                <label
                  className="block cursor-pointer"
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                  onDrop={onDrop}
                >
                  <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                    isDragOver ? 'border-green-500 bg-green-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-4xl mb-4">{isDragOver ? '📥' : '📸'}</div>
                    <p className="text-gray-600 font-medium">{isDragOver ? 'שחרר כאן!' : 'לחץ או גרור תמונה לכאן'}</p>
                    <p className="text-gray-400 text-sm mt-2">ללא אנשים בתמונה</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                </label>
              ) : (
                <div className="relative">
                  <img src={uploadedImage} alt="לפני" className="w-full rounded-2xl max-h-64 object-cover" />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">לפני</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">מה לשנות?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="למשל: רוצה פרקט במקום אריחים, קירות בגוון אפור, תאורה שקועה, וסגנון מודרני..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none h-24"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {showGameLoading && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl text-center">
                <FlappyBirdGame
                  isReady={!!result}
                  onShowResult={() => setShowGameLoading(false)}
                />
                {generating && (
                  <>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {countdown > 0 ? `עוד ${countdown} שניות...` : "לוקח קצת יותר זמן מהרגיל..."}
                    </div>
                    <div className="text-sm text-gray-600 min-h-[40px] flex items-center justify-center">
                      💡 {LOADING_TIPS[tipIdx]}
                    </div>
                  </>
                )}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !description || generating}
              className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  יוצר הדמיה...
                </span>
              ) : (
                '🪄 צור הדמיה'
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">
              זהו הניסיון החינמי היחיד שלך · ללא הרשמה
            </p>
          </div>
        </div>
      )}

      {/* ── Result Modal ─────────────────────────────────── */}
      {result && !showGameLoading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
          <div ref={resultRef} className="bg-white rounded-3xl p-6 max-w-5xl w-full relative max-h-[95vh] overflow-auto">
            <button
              onClick={() => { setResult(null); setShowUploadModal(false); setUploadedImage(null); setDescription(""); }}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl z-10"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 ההדמיה שלך מוכנה!</h3>
            </div>

            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                {uploadedImage && (
                  <>
                    <img src={uploadedImage} alt="לפני" className="w-full rounded-2xl" />
                    <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-full">לפני</span>
                  </>
                )}
              </div>
              <div className="relative">
                <img src={result.image} alt="אחרי" className="w-full rounded-2xl" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי ✨</span>
              </div>
            </div>

            {/* Analysis */}
            {result.analysis && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">📝 ניתוח מקצועי</h4>
                <div className="text-gray-700 text-sm leading-relaxed space-y-3">
                  {result.analysis.split('\n\n').map((paragraph: string, idx: number) => (
                    <p key={idx}>{paragraph.replace(/\*\*/g, '').replace(/\n/g, ' ').trim()}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Cost Estimate */}
            {result.costs && result.costs.total > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">💰 הערכת עלויות</h4>
                <div className="space-y-2">
                  {result.costs.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description}</span>
                      <span className="font-medium">₪{item.total?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>סה״כ משוער</span>
                    <span className="text-green-600">₪{result.costs.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <a
                href={result.image}
                download="shiputzai-visualization.png"
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-center font-medium hover:bg-gray-800 transition-all"
              >
                📥 הורד תמונה
              </a>
              <Link
                href="/signup?redirect=/visualize"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 rounded-full text-center font-medium hover:from-emerald-600 hover:to-green-600 transition-all"
              >
                🎉 הירשם בחינם — צור עוד הדמיות
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
