"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Check, FileSearch, Loader2, LockKeyhole, Search, ShoppingBag, Trophy, Wand2 } from "lucide-react";
import { saveVisualization, loadVisualizations, deleteVisualization, Visualization } from "@/lib/visualizations";
import PricingComparison from "@/components/PricingComparison";
import CreditBadge from "@/components/CreditBadge";
import { trackAction, clearAction } from "@/lib/track-action";
import { authFetch } from "@/lib/auth-fetch";
import { CREDIT_COSTS, getCreditPackPrice, getCreditPackUnitPrice } from "@/lib/credit-costs";
const FlappyBirdGame = dynamic(() => import('@/components/FlappyBirdGame'), { ssr: false });

// Dynamic import for Lottie (client-side only)
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Popcorn waiting animation URL
const POPCORN_ANIMATION_URL = '/popcorn-waiting.json';
const QUICK_EXTRA_CREDIT_PACKS = [
  { credits: 20, badge: null, variant: "default" },
  { credits: 100, badge: "מאוזן", variant: "popular" },
  { credits: 300, badge: "לשימוש כבד", variant: "value" },
] as const;

type ShopLookProduct = {
  id: string;
  name: string;
  position: { top: number; left: number; width?: number; height?: number };
  marker?: { top?: number; left?: number };
  searchQuery: string;
};

function clampPercentage(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function finitePercent(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getShopLookMarkerPosition(product: ShopLookProduct) {
  const position = product.position || { top: 50, left: 50 };
  const width = finitePercent(position.width) ?? 0;
  const height = finitePercent(position.height) ?? 0;
  const fallbackLeft = (finitePercent(position.left) ?? 50) + width / 2;
  const fallbackTop = (finitePercent(position.top) ?? 50) + height / 2;
  const markerLeft = finitePercent(product.marker?.left) ?? fallbackLeft;
  const markerTop = finitePercent(product.marker?.top) ?? fallbackTop;
  const left = clampPercentage(markerLeft, 2, 98);
  const top = clampPercentage(markerTop, 2, 98);

  return {
    left,
    top,
    adjusted: Math.abs(left - markerLeft) > 0.1 || Math.abs(top - markerTop) > 0.1,
  };
}

function getRenderedImageContentBox(image: HTMLImageElement, frame: HTMLElement) {
  const frameRect = frame.getBoundingClientRect();
  const imageRect = image.getBoundingClientRect();
  let left = imageRect.left - frameRect.left;
  let top = imageRect.top - frameRect.top;
  let width = imageRect.width;
  let height = imageRect.height;

  if (image.naturalWidth > 0 && image.naturalHeight > 0 && width > 0 && height > 0) {
    const naturalRatio = image.naturalWidth / image.naturalHeight;
    const renderedRatio = width / height;

    if (renderedRatio > naturalRatio) {
      const contentWidth = height * naturalRatio;
      left += (width - contentWidth) / 2;
      width = contentWidth;
    } else if (renderedRatio < naturalRatio) {
      const contentHeight = width / naturalRatio;
      top += (height - contentHeight) / 2;
      height = contentHeight;
    }
  }

  return {
    left: Math.round(left * 100) / 100,
    top: Math.round(top * 100) / 100,
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
  };
}

function getCleanAnalysisParagraphs(analysis: string) {
  return analysis
    .split(/\n{2,}/)
    .map((paragraph) =>
      paragraph
        .split("\n")
        .map((line) =>
          line
            .replace(/^#{1,6}\s*/, "")
            .replace(/\*\*/g, "")
            .replace(/^\s*[-*]\s*/, "")
            .trim()
        )
        .filter(Boolean)
        .join(" ")
    )
    .filter(Boolean);
}

async function getOptimizedImageDataUrl(file: File): Promise<string> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return originalDataUrl;
  }

  return new Promise<string>((resolve) => {
    const image = new Image();

    image.onload = () => {
      try {
        const maxSide = 1920;
        const largestSide = Math.max(image.width, image.height);
        const scale = largestSide > maxSide ? maxSide / largestSide : 1;
        const width = Math.round(image.width * scale);
        const height = Math.round(image.height * scale);

        if (scale === 1 && file.size < 1_500_000) {
          resolve(originalDataUrl);
          return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(originalDataUrl);
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch {
        resolve(originalDataUrl);
      }
    };

    image.onerror = () => resolve(originalDataUrl);
    image.src = originalDataUrl;
  });
}

function DesignQuestPanel({
  productsCount,
  detectingProducts,
  onShopTheLook,
  compact = false,
}: {
  productsCount: number;
  detectingProducts?: boolean;
  onShopTheLook?: () => void;
  compact?: boolean;
}) {
  const hasProducts = productsCount > 0;
  const progress = hasProducts ? 100 : detectingProducts ? 66 : 48;
  const stages = [
    {
      title: "הדמיה",
      subtitle: "התמונה נוצרה",
      icon: Wand2,
      state: "done",
    },
    {
      title: "פריטים",
      subtitle: detectingProducts ? "סורקים עכשיו" : hasProducts ? `${productsCount} פריטים נמצאו` : "המשימה פתוחה",
      icon: ShoppingBag,
      state: hasProducts ? "done" : "active",
    },
    {
      title: "קנייה",
      subtitle: hasProducts ? "בחרו פריט לחיפוש" : "ייפתח אחרי זיהוי",
      icon: FileSearch,
      state: hasProducts ? "active" : "locked",
    },
  ];

  return (
    <section
      data-testid="visualize-quest-panel"
      className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-200/70 ${compact ? "p-4" : "p-4 sm:p-5"}`}
    >
      <div className="quest-grid-light absolute inset-0 opacity-70" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/80 to-transparent" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              מסע העיצוב שלך
            </div>
            {compact ? (
              <p className="text-sm font-black leading-snug text-slate-950">
                {hasProducts ? "הצעה נפתחה" : detectingProducts ? "סורקים פריטים עכשיו" : "ציד פריטים"}
              </p>
            ) : (
              <>
                <h4 className="text-xl sm:text-2xl font-black leading-tight tracking-normal">
                  {hasProducts ? "המשימה הבאה נפתחה" : "הפכו את התוצאה לרשימת קניות"}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">
                  {hasProducts
                    ? "יש כבר פריטים בתמונה. עכשיו אפשר לבדוק אם הצעת המחיר שקיבלתם הגיונית."
                    : "אחרי רגע הוואו, ממשיכים בלי לעזוב את הדף: מזהים פריטים דומים ומתקדמים לשלב הבא."}
                </p>
              </>
            )}
          </div>
          <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-center">
            <div className="text-[10px] font-semibold text-slate-500">שלב</div>
            <div className="text-lg font-black text-emerald-700">{hasProducts ? "3/3" : "2/3"}</div>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-l from-emerald-300 via-cyan-300 to-amber-300 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className={`${compact ? "mt-3" : "mt-4"} grid grid-cols-3 gap-2`}>
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isDone = stage.state === "done";
            const isActive = stage.state === "active";
            const isLocked = stage.state === "locked";

            return (
              <div
                key={stage.title}
                className={`relative ${compact ? "min-h-[86px] p-2.5" : "min-h-[104px] p-3"} rounded-2xl border transition-all ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 shadow-lg shadow-emerald-100/70"
                    : isDone
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50 opacity-70"
                }`}
              >
                <div className={`mb-2 flex ${compact ? "h-8 w-8" : "h-9 w-9"} items-center justify-center rounded-xl ${
                  isActive ? "bg-emerald-100 text-emerald-700" : isDone ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-400"
                }`}>
                  {isDone ? <Check className="h-5 w-5" /> : isLocked ? <LockKeyhole className="h-4 w-4" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="text-[10px] font-semibold text-slate-400">משימה {index + 1}</div>
                <div className="mt-0.5 text-sm font-black leading-tight text-slate-950">{stage.title}</div>
                <div className={`${compact ? "hidden" : "mt-1"} text-[11px] leading-snug text-slate-500`}>{stage.subtitle}</div>
              </div>
            );
          })}
        </div>

        <div className={`${compact ? "mt-3" : "mt-4"} flex flex-col gap-3 sm:flex-row`}>
          {compact && (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 sm:w-auto">
              {detectingProducts ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Trophy className="h-4 w-4 text-amber-500" />}
              {hasProducts ? "התקדמות נשמרה" : detectingProducts ? "הסריקה רצה" : "מוכן לסריקה"}
            </div>
          )}
          {!compact && !hasProducts && onShopTheLook && (
            <button
              type="button"
              onClick={onShopTheLook}
              disabled={detectingProducts}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
            >
              {detectingProducts ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {detectingProducts ? "סורק פריטים..." : "התחילו ציד פריטים"}
            </button>
          )}
          {hasProducts && (
            <div className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 sm:w-auto">
              בחרו פריט בתמונה
              <Search className="h-4 w-4" />
            </div>
          )}
          {!compact && <div className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600 sm:justify-start">
            <Trophy className="h-4 w-4 text-amber-500" />
            {hasProducts ? "התקדמות נשמרה" : "פותחים יכולת חדשה אחרי ההדמיה"}
          </div>}
        </div>
      </div>
    </section>
  );
}

// Add keyframes for animations
const animationStyles = `
@keyframes bounce-in {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes bounce-subtle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
@keyframes progress-bar {
  0% { width: 0%; }
  100% { width: 100%; }
}
@keyframes shop-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
@keyframes tap-ripple {
  0% { transform: scale(0.6); opacity: 0.6; }
  50% { transform: scale(1.8); opacity: 0; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}
.animate-progress-bar {
  animation: progress-bar 2s ease-in-out;
}
.animate-shop-pulse {
  animation: shop-pulse 2s ease-in-out infinite;
}
.shop-btn-ripple {
  position: relative;
  overflow: visible;
}
.shop-btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.4);
  animation: tap-ripple 2s ease-out infinite;
  pointer-events: none;
}
@keyframes slide-reveal {
  0% { clip-path: inset(0 100% 0 0); }
  50% { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 100% 0 0); }
}
@keyframes pulse-arrow {
  0%, 100% { opacity: 0.4; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(-4px); }
}
@keyframes float-badge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
@keyframes quest-ping {
  0% { transform: scale(0.9); opacity: 0.55; }
  70%, 100% { transform: scale(1.7); opacity: 0; }
}
@keyframes quest-scan {
  0% { transform: translateY(-120%); opacity: 0; }
  15% { opacity: 0.8; }
  85% { opacity: 0.8; }
  100% { transform: translateY(120%); opacity: 0; }
}
@keyframes quest-glow {
  0%, 100% { opacity: 0.7; filter: saturate(1); }
  50% { opacity: 1; filter: saturate(1.25); }
}
.animate-slide-reveal {
  animation: slide-reveal 6s ease-in-out infinite;
}
.animate-pulse-arrow {
  animation: pulse-arrow 1.5s ease-in-out infinite;
}
.animate-float-badge {
  animation: float-badge 3s ease-in-out infinite;
}
.animate-quest-ping {
  animation: quest-ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
}
.animate-quest-scan {
  animation: quest-scan 2.4s ease-in-out infinite;
}
.animate-quest-glow {
  animation: quest-glow 2.8s ease-in-out infinite;
}
.quest-grid {
  background-image:
    linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 22px 22px;
}
.quest-grid-light {
  background-image:
    linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px);
  background-size: 22px 22px;
}
`;

interface ShopItem {
  x: number;
  y: number;
  title: string;
  price: string;
  searchQuery: string;
}

interface ExampleCard {
  id: number;
  title: string;
  beforeImg: string;
  afterImg: string;
  beforeDesc: string;
  afterDesc: string;
  changes: string;
  costs: { item: string; price: number }[];
  total: number;
  shopItems?: ShopItem[];
}

const EXAMPLES: ExampleCard[] = [
  {
    id: 1,
    title: "סלון מודרני",
    beforeImg: "/examples/visualize-room-before-v2.jpg",
    afterImg: "/examples/visualize-room-after-v2.jpg",
    beforeDesc: "סלון קלאסי עם ריהוט מסורתי, שטיח פרסי ותאורה ישנה",
    afterDesc: "סלון מודרני עם ספה אפורה, כורסה כתומה, תמונות גרפיות ותאורת LED",
    changes: "ריהוט מודרני חדש, תאורת LED, תמונות דקורטיביות, שטיח גיאומטרי",
    costs: [
      { item: "פרקט עץ אלון (25 מ״ר)", price: 6250 },
      { item: "תאורה שקועה (8 ספוטים)", price: 2400 },
      { item: "צביעה (60 מ״ר)", price: 2400 },
      { item: "עבודה", price: 4500 },
    ],
    total: 15550,
    shopItems: [
      { x: 23, y: 52, title: "ספה פינתית אפורה עם שזלונג", price: "₪8,500", searchQuery: "ספה פינתית אפורה בד עם שזלונג ורגלי מתכת שחורות" },
      { x: 54, y: 79, title: "כורסה כתומה מודרנית", price: "₪2,200", searchQuery: "כורסה כתומה בד מודרנית רגלי מתכת שחורות" },
      { x: 42, y: 21, title: "סט תמונות אבסטרקט שחור כתום", price: "₪1,800", searchQuery: "סט שלוש תמונות אבסטרקט שחור כתום אפור מסגרת שחורה לסלון" },
      { x: 25, y: 22, title: "מנורת קשת כרום עם אהיל כיפה", price: "₪1,400", searchQuery: "מנורת קשת רצפה כרום אהיל כיפה כסוף לסלון" },
      { x: 64, y: 65, title: "שולחן סלון זכוכית מסגרת שחורה", price: "₪1,900", searchQuery: "שולחן סלון זכוכית מלבני מסגרת מתכת שחורה מדף תחתון" },
      { x: 53, y: 82, title: "שטיח גיאומטרי אפור בז", price: "₪2,400", searchQuery: "שטיח סלון גיאומטרי אפור בז מלבני מודרני" },
      { x: 86, y: 28, title: "וילונות פשתן אפורים נשפכים", price: "₪1,300", searchQuery: "וילון פשתן אפור ארוך לסלון שקוף למחצה" },
    ],
  },
  {
    id: 2,
    title: "מטבח כפרי",
    beforeImg: "/examples/kitchen-before.jpg",
    afterImg: "/examples/kitchen-after.jpg",
    beforeDesc: "מטבח מיושן עם ארונות לבנים, אריחי קיר בז׳ ומשטח גרניט חום",
    afterDesc: "מטבח כפרי חם עם ארונות עץ כהים, חיפוי אבן טבעית ומנורות ראטן",
    changes: "ארונות עץ אלון כהה, משטח קוורץ לבן, חיפוי אבן טבעית, מנורות ראטן",
    costs: [
      { item: "חזיתות עץ אלון (4 מטר)", price: 8000 },
      { item: "משטח שיש קיסר", price: 4500 },
      { item: "חיפוי קרמיקה (3 מ״ר)", price: 1800 },
      { item: "עבודה והתקנה", price: 3500 },
    ],
    total: 17800,
    shopItems: [
      { x: 19, y: 11, title: "מנורת תלייה ראטן כיפה", price: "₪890", searchQuery: "מנורת תלייה ראטן כיפה טבעית למטבח כפרי" },
      { x: 46, y: 9, title: "מנורת תלייה ראטן רחבה", price: "₪890", searchQuery: "מנורת תלייה ראטן רחבה קלועה למטבח כפרי" },
      { x: 46, y: 49, title: "ברז מטבח ברונזה וינטג׳", price: "₪1,200", searchQuery: "ברז מטבח ברונזה עתיק וינטג פיה גבוהה" },
      { x: 78, y: 34, title: "מדפי עץ פתוחים לכלים", price: "₪1,600", searchQuery: "מדפי עץ פתוחים למטבח כפרי עם תומכים שחורים" },
      { x: 54, y: 61, title: "מדיח כלים נירוסטה אינטגרלי", price: "₪3,200", searchQuery: "מדיח כלים נירוסטה חזית מלאה 60 סנטימטר" },
      { x: 45, y: 79, title: "שטיח מטבח קילים שחור לבן", price: "₪450", searchQuery: "שטיח מטבח קילים שחור לבן גיאומטרי מלבני" },
      { x: 17, y: 50, title: "עציץ עשבי תיבול בסל קש", price: "₪85", searchQuery: "עציץ עשבי תיבול בסל קש למטבח" },
    ],
  },
  {
    id: 3,
    title: "חדר שינה מינימליסטי",
    beforeImg: "/examples/bedroom-before.jpg",
    afterImg: "/examples/bedroom-after.jpg",
    beforeDesc: "חדר שינה ישן עם ארון עץ כהה, מיטת יחיד ותאורה פלורסנטית",
    afterDesc: "חדר שינה מינימליסטי עם ארון לבן ומראה, מיטה זוגית אפורה ופרקט עץ",
    changes: "ארון הזזה לבן עם מראה, מיטה זוגית מרופדת, פרקט אלון, תאורה שקועה",
    costs: [
      { item: "ארון הזזה עם מראה (3 מטר)", price: 9500 },
      { item: "פרקט אלון (15 מ״ר)", price: 3750 },
      { item: "תאורה שקועה (6 ספוטים)", price: 1800 },
      { item: "צביעה אפור (45 מ״ר)", price: 1800 },
      { item: "עבודה", price: 3500 },
    ],
    total: 20350,
    shopItems: [
      { x: 20, y: 43, title: "ארון הזזה לבן עם מראה", price: "₪9,500", searchQuery: "ארון הזזה לבן עם דלת מראה לחדר שינה" },
      { x: 64, y: 58, title: "מיטה זוגית מרופדת אפורה", price: "₪4,200", searchQuery: "מיטה זוגית מרופדת אפורה ראש מיטה נמוך מודרני" },
      { x: 90, y: 50, title: "מנורת שולחן זכוכית לבנה", price: "₪380", searchQuery: "מנורת שולחן זכוכית שקופה אהיל לבן לחדר שינה" },
      { x: 86, y: 66, title: "שידת לילה עגולה בטון", price: "₪650", searchQuery: "שידת לילה עגולה אפורה בטון מודרנית" },
      { x: 74, y: 30, title: "תמונת אבסטרקט שחור בז׳", price: "₪890", searchQuery: "תמונת קנבס אבסטרקט שחור בז אפור לחדר שינה" },
      { x: 13, y: 77, title: "כיסא לאונג׳ עץ בהיר", price: "₪1,800", searchQuery: "כיסא לאונג עץ בהיר סקנדינבי לחדר שינה" },
      { x: 38, y: 86, title: "שטיח גיאומטרי אפור בהיר", price: "₪1,200", searchQuery: "שטיח חדר שינה גיאומטרי אפור בהיר מלבני" },
    ],
  },
];

const VISUALIZE_CONTROL_CHIPS = [
  {
    label: "שמור מבנה",
    text: "שמור על מבנה החדר, החלונות, הדלתות והפרספקטיבה. שנה רק עיצוב, חומרים וריהוט.",
  },
  {
    label: "רק קירות",
    text: "שנה רק את צבע וטקסטורת הקירות. אל תשנה ריצוף, חלונות או מבנה.",
  },
  {
    label: "רק ריצוף",
    text: "החלף רק את הריצוף לפרקט/אבן/אריחים חדשים. שמור על שאר החדר כפי שהוא.",
  },
  {
    label: "הסר רהיטים",
    text: "נקה רהיטים קיימים והצע סידור חדש, בלי לשנות את מבנה החדר.",
  },
  {
    label: "מודרני חם",
    text: "עיצוב מודרני חם: צבעים טבעיים, עץ בהיר, תאורה רכה, טקסטיל נעים ותחושה ביתית.",
  },
  {
    label: "יוקרתי נקי",
    text: "עיצוב יוקרתי נקי: חומרים איכותיים, קווים שקטים, תאורה נסתרת ופלטה ניטרלית.",
  },
];

function BeforeAfterSlider({ beforeImg, afterImg, showShopLook = false, shopItems = [] }: { beforeImg: string; afterImg: string; showShopLook?: boolean; shopItems?: ShopItem[] }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedShopItem, setSelectedShopItem] = useState<ShopItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleAfterClick = (e: React.MouseEvent) => {
    if (!isDragging && showShopLook) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        if (clickX < sliderPosition) {
          setShowModal(true);
        }
      }
    }
  };

  const closeShopModal = () => {
    setShowModal(false);
    setSelectedShopItem(null);
  };

  const getDemoShoppingUrl = (item: ShopItem) => {
    return `https://www.google.com/search?q=${encodeURIComponent(item.searchQuery + ' לקנות בישראל')}&tbm=shop`;
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 select-none touch-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {/* After image (LEFT side) */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src={afterImg} 
            alt="אחרי" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs px-2 py-1 rounded">
            אחרי
          </div>
        </div>
        
        {/* Shop the Look Button - only show when after image is visible */}
        {showShopLook && sliderPosition > 20 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="absolute bottom-3 left-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-full flex items-center gap-1.5 shadow-lg transition-colors z-10 pointer-events-auto"
          >
            <img src="/icons/cart.png" alt="סמל עגלת קניות" className="w-5 h-5" />
            <span>לחץ לקנות</span>
          </button>
        )}
        
        {/* Before image (RIGHT side) */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <img 
            src={beforeImg} 
            alt="לפני" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            לפני
          </div>
        </div>
        
        {/* Slider handle - only this is draggable */}
        <div 
          className="absolute top-0 bottom-0 w-6 cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-lg -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-gray-400">↔</span>
          </div>
        </div>
      </div>
      
      {/* Shop the Look Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={closeShopModal}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={closeShopModal}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100"
            >
              ✕
            </button>
            
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center flex items-center justify-center gap-2"><img src="/icons/cart.png" alt="סמל עגלת קניות" className="w-6 h-6" /> Shop the Look</h3>
              <p className="text-sm text-gray-500 text-center mb-4">בחרו פריט בתמונה, ואז עברו לחיפוש קנייה מדויק.</p>
              
              <div className="relative">
                <img src={afterImg} alt="אחרי" className="w-full rounded-xl" />
                
                {/* Product Hotspots - dynamic per room */}
                {shopItems.map((item, index) => (
                  <ShopHotspot
                    key={index}
                    item={item}
                    selected={selectedShopItem?.title === item.title}
                    onSelect={setSelectedShopItem}
                  />
                ))}
              </div>

              {selectedShopItem && (
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">הפריט שנבחר</p>
                      <h4 className="text-base font-semibold text-gray-900 leading-snug break-words">{selectedShopItem.title}</h4>
                      <p className="mt-1 text-sm font-bold text-emerald-700">{selectedShopItem.price}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedShopItem(null)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-gray-900"
                      aria-label="בטל בחירת פריט"
                    >
                      ✕
                    </button>
                  </div>
                  <a
                    href={getDemoShoppingUrl(selectedShopItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800 sm:w-auto"
                  >
                    חיפוש בגוגל שופינג
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShopHotspot({ item, selected, onSelect }: { item: ShopItem; selected: boolean; onSelect: (item: ShopItem) => void }) {
  return (
    <div 
      className="absolute"
      style={{ left: `${item.x}%`, top: `${item.y}%` }}
    >
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-label={`הצג את הפריט ${item.title}`}
        aria-pressed={selected}
        className="group block"
      >
        <div className={`w-7 h-7 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-125 transition-transform cursor-pointer border-2 ${selected ? "border-gray-900 scale-110" : "border-emerald-500 animate-pulse"}`}>
          <span className="text-xs font-bold text-emerald-600">+</span>
        </div>
        <div className="absolute top-9 right-1/2 translate-x-1/2 bg-white rounded-xl shadow-xl p-3 min-w-[190px] max-w-[240px] z-10 border border-gray-100 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm font-medium text-gray-900 mb-1 leading-snug">{item.title}</p>
          <p className="text-sm text-emerald-600 font-bold mb-1">{item.price}</p>
          <p className="text-xs text-blue-600">לחצו להצגת פריט</p>
        </div>
      </button>
    </div>
  );
}

function ExampleCardComponent({ example }: { example: ExampleCard }) {
  const [showDetails, setShowDetails] = useState(false);
  const showShopFeature = example.id === 1 || example.id === 2 || example.id === 3; // Enable Shop the Look for all rooms

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300">
      <BeforeAfterSlider beforeImg={example.beforeImg} afterImg={example.afterImg} showShopLook={showShopFeature} shopItems={example.shopItems} />
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{example.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{example.changes}</p>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-900 hover:text-gray-600 font-medium"
        >
          {showDetails ? "הסתר פירוט עלויות ↑" : "הצג פירוט עלויות ↓"}
        </button>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
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

export default function VisualizePage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false); // Main subscription
  const [vizCredits, setVizCredits] = useState<number | null>(null); // null = not loaded yet
  const [showPacksModal, setShowPacksModal] = useState(false);
  const [guestUsed, setGuestUsed] = useState(false); // Guest trial (no login)
  const [showPaywall, setShowPaywall] = useState(false);
  const [showTrialSuccess, setShowTrialSuccess] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedControlChip, setSelectedControlChip] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showGameLoading, setShowGameLoading] = useState(false); // keeps game visible after generation done
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'separate'>('plus');
  const [generatedResult, setGeneratedResult] = useState<{image: string, beforeImage: string, analysis: string, costs: any} | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [currentTip, setCurrentTip] = useState(0);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopLookError, setShopLookError] = useState("");
  const [selectedShopLookProduct, setSelectedShopLookProduct] = useState<ShopLookProduct | null>(null);
  // Products cache: keyed by result image URL so it also works before DB save completes.
  const [productsCache, setProductsCache] = useState<Record<string, ShopLookProduct[]>>({});
  const [currentVisualizationId, setCurrentVisualizationId] = useState<string | null>(null);
  const [detectingProducts, setDetectingProducts] = useState(false);
  const shopLookFrameRef = useRef<HTMLDivElement>(null);
  const shopLookImageRef = useRef<HTMLImageElement>(null);
  const [shopLookImageBox, setShopLookImageBox] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const persistedShopLookKeys = useRef<Set<string>>(new Set());
  
  // Get products for current visualization from cache
  const activeShopLookCacheKey = generatedResult?.image || currentVisualizationId;
  const detectedProducts = activeShopLookCacheKey ? (productsCache[activeShopLookCacheKey] || []) : [];
  
  // Helper to set products for a specific visualization
  const setCachedProducts = (vizId: string, products: ShopLookProduct[]) => {
    setProductsCache(prev => ({ ...prev, [vizId]: products }));
  };
  
  // Helper to clear current visualization context (when starting new image)
  const clearProductsCache = () => {
    setCurrentVisualizationId(null);
  };
  
  const [visualizationHistory, setVisualizationHistory] = useState<{id: string, beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, createdAt: string, detectedProducts?: any[]}[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{id: string, beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, createdAt: string, detectedProducts?: any[]} | null>(null);
  const [savingToCloud, setSavingToCloud] = useState(false);
  const [waitingAnimationData, setWaitingAnimationData] = useState<object | null>(null);
  
  const [packsAnimationData, setPacksAnimationData] = useState<object | null>(null);

  const updateShopLookImageBox = useCallback(() => {
    const frame = shopLookFrameRef.current;
    const image = shopLookImageRef.current;

    if (!frame || !image) return;

    const nextBox = getRenderedImageContentBox(image, frame);
    if (nextBox.width <= 0 || nextBox.height <= 0) return;

    setShopLookImageBox(current => {
      if (
        Math.abs(current.left - nextBox.left) < 0.5 &&
        Math.abs(current.top - nextBox.top) < 0.5 &&
        Math.abs(current.width - nextBox.width) < 0.5 &&
        Math.abs(current.height - nextBox.height) < 0.5
      ) {
        return current;
      }

      return nextBox;
    });
  }, []);

  useEffect(() => {
    if (!showShopModal || !generatedResult?.image) {
      setShopLookImageBox({ left: 0, top: 0, width: 0, height: 0 });
      return;
    }

    updateShopLookImageBox();
    const animationFrame = window.requestAnimationFrame(updateShopLookImageBox);
    window.addEventListener("resize", updateShopLookImageBox);

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateShopLookImageBox) : null;
    if (shopLookFrameRef.current) resizeObserver?.observe(shopLookFrameRef.current);
    if (shopLookImageRef.current) resizeObserver?.observe(shopLookImageRef.current);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateShopLookImageBox);
      resizeObserver?.disconnect();
    };
  }, [generatedResult?.image, showShopModal, updateShopLookImageBox]);
  
  // Load animations
  useEffect(() => {
    fetch(POPCORN_ANIMATION_URL)
      .then(res => res.json())
      .then(data => setWaitingAnimationData(data))
      .catch(err => console.error('Failed to load waiting animation:', err));
    
    // Load packs modal animation (local file - reliable)
    fetch('/lottie-image-pack.json')
      .then(res => res.json())
      .then(data => setPacksAnimationData(data))
      .catch(err => console.error('Failed to load packs animation:', err));
  }, []);
  
  const LOADING_TIPS = [
    "💡 קבל לפחות 3 הצעות מחיר לפני שמתחילים",
    "📋 תעד הכל בכתב - זה יחסוך לך כאבי ראש",
    "🔍 בדוק המלצות על קבלנים לפני שסוגרים",
    "💰 השאר 15% מהתקציב לבלת\"מים",
    "📅 שיפוץ תמיד לוקח יותר זמן מהצפוי",
    "🏠 צלם את המצב הקיים לפני שמתחילים",
    "⚡️ החשמל והאינסטלציה - לא חוסכים עליהם",
    "🎨 בחר צבעים ניטרליים - קל לשנות אחר כך",
    "📦 הזמן חומרים מראש - יש עיכובים באספקה",
    "✅ בדוק שהקבלן מבוטח ורשום"
  ];
  
  // Check guest trial status (localStorage + cookie)
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

  // Countdown and tips rotation when generating
  useEffect(() => {
    if (!generating) {
      setCountdown(60);
      setCurrentTip(0);
      return;
    }
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % LOADING_TIPS.length);
    }, 3000);
    
    return () => {
      clearInterval(countdownInterval);
      clearInterval(tipInterval);
    };
  }, [generating]);

  useEffect(() => {
    const checkAuth = async () => {
      let releasedInitialState = false;
      const releaseInitialState = () => {
        if (!releasedInitialState) {
          setAuthLoading(false);
          releasedInitialState = true;
        }
      };

      try {
        const userData = localStorage.getItem("user");
        let userEmail = "";
        let currentUserId = "";
        
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) {
            setIsLoggedIn(true);
            setUserId(user.id);
            setUserEmail(user.email);
            userEmail = user.email;
            currentUserId = user.id;
            setHasPurchased(user.purchased === true);
            setHasSubscription(user.vision_subscription === true || user.vision_subscription === "active" || user.vision_subscription === "true");
            setTrialUsed(user.vision_trial_used === true);
            if (typeof user.viz_credits === "number") {
              setVizCredits(user.viz_credits);
            }
            const hasCachedCreditBalance = typeof user.viz_credits === "number";
            const needsCreditBalance =
              user.vision_subscription === true || user.vision_subscription === "active" || user.vision_subscription === "true";
            if (!needsCreditBalance || hasCachedCreditBalance) {
              releaseInitialState();
            }
          }
        } else {
          releaseInitialState();
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            setUserId(session.user.id);
            setUserEmail(session.user.email || null);
            userEmail = session.user.email || "";
            currentUserId = session.user.id;
            // Session exists but localStorage is empty - save user data!
            localStorage.setItem("user", JSON.stringify({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || "",
              purchased: false
            }));
            setHasPurchased(false);
          }
        }
        
        // Check if user should have trial reset (from admin panel)
        if (userEmail) {
          const encodedEmail = encodeURIComponent(userEmail);
          const [resetResult, premiumResult, creditsResult, trialResult] = await Promise.allSettled([
            authFetch(`/api/admin/trial-reset?email=${encodedEmail}`).then(res => res.json()),
            authFetch(`/api/admin/premium?email=${encodedEmail}`).then(res => res.json()),
            authFetch(`/api/viz-credits?email=${encodedEmail}`).then(res => res.json()),
            authFetch(`/api/vision-trial?email=${encodedEmail}`).then(async res => res.ok ? res.json() : null),
          ]);

          if (resetResult.status === "fulfilled" && resetResult.value?.shouldReset) {
            // Trial reset triggered from admin - DB already updated
            setTrialUsed(false);
            console.log("Trial reset for user:", userEmail);
          }

          // Check if user has the main ShiputzAI subscription (purchased) and Vision subscription
          if (premiumResult.status === "fulfilled") {
            const premData = premiumResult.value;
            if (premData?.hasPremium) {
              // User has main premium - update localStorage ONLY if we have valid user data
              const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
              if (storedUser.id) {
                localStorage.setItem("user", JSON.stringify({
                  ...storedUser,
                  purchased: true,
                  vision_subscription: premData.hasVision ? "active" : storedUser.vision_subscription,
                  viz_credits: typeof premData.vizCredits === "number" ? premData.vizCredits : storedUser.viz_credits,
                }));
              }
              setHasPurchased(true);
            }
            // Check Vision subscription from database
            setHasSubscription(premData?.hasVision === true);
          }
          
          // Fetch viz credits
          if (creditsResult.status === "fulfilled") {
            setVizCredits(
              typeof creditsResult.value?.vizCredits === "number"
                ? creditsResult.value.vizCredits
                : 0
            );
          }

          // Check trial status from database
          if (trialResult.status === "fulfilled" && trialResult.value) {
            setTrialUsed(trialResult.value.trialUsed || false);
          }
        }
      } catch {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
        setUserEmail(user.email || null);
        setHasPurchased(user.purchased === true);
        setHasSubscription(user.vision_subscription === true || user.vision_subscription === "active" || user.vision_subscription === "true");
        setTrialUsed(user.vision_trial_used === true);
        if (typeof user.viz_credits === "number") {
          setVizCredits(user.viz_credits);
        }
        if (user.id) {
          setUserId(user.id);
          // Trial and subscription are checked from DB, this is fallback
        }
      } finally {
        releaseInitialState();
      }
    };
    checkAuth();
  }, []);

  // Load visualization history from Supabase
  const reloadHistory = async (forUserId?: string) => {
    const effectiveUserId = forUserId || userId;
    if (!effectiveUserId) return;
    
    try {
      const data = await loadVisualizations(effectiveUserId);
      // Map Supabase format to local format
      const mapped = data.map(v => ({
        id: v.id,
        beforeImage: v.before_image_url,
        afterImage: v.after_image_url,
        description: v.description,
        analysis: v.analysis,
        costs: v.costs,
        createdAt: v.created_at,
        detectedProducts: v.detected_products || []
      }));
      setVisualizationHistory(mapped);
      
      // Populate products cache from DB data
      const newCache: Record<string, any[]> = {};
      mapped.forEach(v => {
        if (v.detectedProducts && v.detectedProducts.length > 0) {
          newCache[v.id] = v.detectedProducts;
          newCache[v.afterImage] = v.detectedProducts;
        }
      });
      setProductsCache(prev => ({ ...prev, ...newCache }));
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };
  
  useEffect(() => {
    if (userId) {
      reloadHistory(userId);
    }
  }, [userId]);

  // Save visualization to Supabase
  const saveToHistory = async (beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, currentUserId?: string): Promise<string | null> => {
    // Use passed userId or fallback to state, then to localStorage
    const effectiveUserId = currentUserId || userId || JSON.parse(localStorage.getItem("user") || "{}").id;
    
    if (!effectiveUserId) {
      console.error("saveToHistory: No userId available", { currentUserId, userId, localStorage: localStorage.getItem("user") });
      return null;
    }
    
    console.log("saveToHistory: Saving with userId:", effectiveUserId);
    
    setSavingToCloud(true);
    try {
      const saved = await saveVisualization(effectiveUserId, beforeImage, afterImage, description, analysis, costs);
      if (saved) {
        console.log("saveToHistory: Save successful!", saved.id);
        // Store the visualization ID for product saving
        setCurrentVisualizationId(saved.id);
        // Add to local state
        const newItem = {
          id: saved.id,
          beforeImage: saved.before_image_url,
          afterImage: saved.after_image_url,
          description: saved.description,
          analysis: saved.analysis,
          costs: saved.costs,
          createdAt: saved.created_at
        };
        setVisualizationHistory(prev => [newItem, ...prev].slice(0, 50));
        return saved.id;
      } else {
        console.error("saveToHistory: Save returned null");
        return null;
      }
    } catch (e) {
      console.error("Failed to save to cloud:", e);
      return null;
    } finally {
      setSavingToCloud(false);
    }
  };

  // Delete visualization from Supabase
  const deleteFromHistory = async (itemId: string) => {
    if (!userId) return;
    
    const success = await deleteVisualization(itemId, userId);
    if (success) {
      setVisualizationHistory(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleTryNow = () => {
    // Guest (not logged in): allow one free trial
    if (!isLoggedIn) {
      if (guestUsed) {
        // Already used guest trial - prompt signup
        setShowPaywall(true);
        return;
      }
      setShowUploadModal(true);
      return;
    }
    
    if (trialUsed && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    
    // Pro user with 0 credits - show packs modal
    if (hasSubscription && vizCredits === 0) {
      setShowPacksModal(true);
      return;
    }
    
    // Show upload modal for trial or subscription users
    setShowUploadModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setGenerateError('יש להעלות קובץ תמונה בלבד');
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setGenerateError('התמונה גדולה מדי. גודל מקסימלי: 10MB');
      return;
    }
    
    // Clear any previous errors
    setGenerateError('');
    
    try {
      const optimizedImage = await getOptimizedImageDataUrl(file);
      setUploadedImage(optimizedImage);
      trackAction('visualize', '/visualize');
    } catch {
      setGenerateError('לא הצלחנו לקרוא את התמונה. נסה קובץ אחר');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !description) return;
    
    setGenerating(true);
    setShowGameLoading(true);
    setGenerateError("");
    
    try {
      // Guest mode: use guest API (no auth required)
      const isGuest = !isLoggedIn;
      const apiUrl = isGuest ? '/api/visualize-guest' : '/api/visualize';
      const apiBody = isGuest
        ? { image: uploadedImage, description }
        : { image: uploadedImage, description, userEmail };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody)
      });
      
      const data = await res.json();
      
      if (res.status === 402 || data.creditError) {
        setShowGameLoading(false);
        setGenerateError(`אין מספיק קרדיטים (נדרש: ${data.required || '?'}, יתרה: ${data.balance || 0}). <a href="/pricing" style="color:#10b981;text-decoration:underline">רכישת קרדיטים</a>`);
      } else if (data.error) {
        setShowGameLoading(false);
        setGenerateError(data.error);
      } else {
        const generatedImage = data.generatedImage;
        const analysis = data.analysis;
        const costs = isGuest ? data.costs : data.costEstimate;

        if (isGuest) {
          // Mark guest trial as used
          try { localStorage.setItem("shiputz_guest_trial", "true"); } catch {}
          setGuestUsed(true);
        } else {
          // Consume trial if not subscribed - save to DB
          if (!hasSubscription && userEmail) {
            try {
              await authFetch('/api/vision-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
              });
              setTrialUsed(true);
            } catch (e) {
              console.error("Failed to mark trial as used:", e);
            }
          }
        }
        
        setGeneratedResult({
          image: generatedImage,
          beforeImage: uploadedImage || '',
          analysis: analysis,
          costs: costs
        });
        setShowGameLoading(false);
        setShowUploadModal(false);
        clearAction(); // User completed - clear abandoned tracking
        // Update credits after successful generation
        if (data.usedCredit && vizCredits !== null) {
          setVizCredits(Math.max(0, vizCredits - 1));
        }
        clearProductsCache(); // Clear products for new image
        
        // Save to history (only for logged-in users)
        if (!isGuest) {
          const currentUserId = userId || JSON.parse(localStorage.getItem("user") || "{}").id;
          if (uploadedImage && generatedImage && currentUserId) {
            console.log("handleGenerate: Calling saveToHistory with userId:", currentUserId);
            saveToHistory(uploadedImage, generatedImage, description, analysis, costs, currentUserId)
              .then(() => {
                setTimeout(() => reloadHistory(currentUserId), 1000);
              })
              .catch(e => console.error('Failed to save to history:', e));
          } else {
            console.error("handleGenerate: Cannot save - missing data", { 
              hasUploadedImage: !!uploadedImage, 
              hasGeneratedImage: !!generatedImage, 
              currentUserId 
            });
          }
        }
      }
    } catch (err) {
      setShowGameLoading(false);
      setGenerateError("שגיאה בחיבור לשרת. ייתכן שיש אנשים בתמונה - נסה תמונה ללא אנשים.");
    }
    
    setGenerating(false);
  };

  const persistProductsForVisualization = (visualizationId: string, products: ShopLookProduct[]) => {
    if (!visualizationId || products.length === 0) return;

    const persistKey = `${visualizationId}:${products.map(product => product.id).join(",")}`;
    if (persistedShopLookKeys.current.has(persistKey)) return;
    persistedShopLookKeys.current.add(persistKey);

    fetch('/api/update-visualization-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visualizationId, products, userId })
    }).catch(e => console.error('Failed to save products to DB:', e));
  };

  useEffect(() => {
    if (!currentVisualizationId || !generatedResult?.image) return;
    const products = productsCache[generatedResult.image] || [];
    persistProductsForVisualization(currentVisualizationId, products);
  }, [currentVisualizationId, generatedResult?.image, productsCache]);

  const detectProductsForVisualization = async (cacheKey: string, imageUrl: string, persistVisualizationId?: string | null) => {
    setDetectingProducts(true);
    setShopLookError("");
    
    try {
      const userData = localStorage.getItem("user");
      const userEmailForProducts = userData ? JSON.parse(userData).email : null;
      
      const res = await fetch('/api/detect-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl, userEmail: userEmailForProducts })
      });
      
      const data = await res.json();
      if (res.status === 401) {
        setShopLookError("כדי לזהות מוצרים ולקבל קישורי Google Shopping צריך להתחבר או להירשם.");
        return;
      }
      if (res.status === 402 || data?.creditError) {
        setShopLookError(`אין מספיק קרדיטים ל-Shop the Look. נדרש: ${data?.required || "?"}, יתרה: ${data?.balance || 0}.`);
        return;
      }
      if (data.items && data.items.length > 0) {
        // Single write to cache - this is the only place products live
        setCachedProducts(cacheKey, data.items);
        
        // Persist to DB (fire and forget)
        if (persistVisualizationId) {
          persistProductsForVisualization(persistVisualizationId, data.items);
        }
      } else {
        setShopLookError("לא זוהו מוצרים ברורים בתמונה. אפשר לנסות סריקה מחדש.");
      }
    } catch (err) {
      console.error("Failed to detect products:", err);
      setShopLookError("הסריקה נכשלה כרגע. נסה שוב בעוד רגע.");
    } finally {
      setDetectingProducts(false);
    }
  };

  const handleShopTheLook = async () => {
    if (!generatedResult?.image) return;
    
    const cacheKey = generatedResult.image;
    setShopLookError("");
    setSelectedShopLookProduct(null);
    setShowShopModal(true);
    
    // Products are derived from cache - if already there, nothing to do
    if ((productsCache[cacheKey] || []).length > 0) {
      return;
    }
    
    // No products in cache - scan and save
    await detectProductsForVisualization(cacheKey, generatedResult.image, currentVisualizationId);
  };

  const heroCtaLabel = (() => {
    if (isLoggedIn) {
      if (hasSubscription) {
        if (vizCredits === null) return "בודק יתרת הדמיות...";
        return vizCredits === 0 ? "רכוש חבילת הדמיות" : `צור הדמיה (${vizCredits} נותרו)`;
      }
      return trialUsed ? "שדרגו לתוכנית מנוי" : "נסו עכשיו בחינם →";
    }

    return guestUsed ? "הירשם בחינם - צור עוד הדמיות →" : "נסו עכשיו בחינם →";
  })();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-3">
            <CreditBadge />
            <Link href="/tips" className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all">
              מאמרים וטיפים
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all">
                התחברות
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - optimized for mobile ad traffic */}
      <section className="pt-20 pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 leading-tight">
            ראו את השיפוץ לפני שמתחילים.<br />
            <span className="text-gray-900">העלו תמונה וקבלו כיוון ויזואלי.</span>
          </h1>
          
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
            שומרים ככל האפשר על מבנה החדר, מחליפים עיצוב וחומרים, ומקבלים בסיס החלטה לפני שיחה עם קבלן.
          </p>

          {/* CTA FIRST on mobile - before the image */}
          <div className="flex flex-col items-center gap-3 mb-8">
            {authLoading ? (
              <div className="relative bg-gray-900/20 px-10 py-4 rounded-full text-lg font-medium overflow-hidden">
                <span className="text-transparent">נסו עכשיו בחינם</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            ) : (
              <>
                <button
                  onClick={handleTryNow}
                  disabled={isLoggedIn && hasSubscription && vizCredits === null}
                  className="rounded-full border border-gray-200 bg-white px-10 py-5 text-xl font-bold text-gray-950 shadow-[0_18px_42px_rgba(15,23,42,0.12)] ring-1 ring-white transition-all hover:scale-105 hover:border-gray-300 hover:bg-gray-50 hover:shadow-[0_22px_48px_rgba(15,23,42,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-gray-200/80 animate-bounce-subtle"
                >
                  {heroCtaLabel}
                </button>
                {!isLoggedIn && !guestUsed && (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><span className="text-gray-400">✓</span> בחינם</span>
                    <span className="flex items-center gap-1"><span className="text-gray-400">✓</span> בלי הרשמה</span>
                    <span className="flex items-center gap-1"><span className="text-gray-400">✓</span> לפני/אחרי אמיתי</span>
                  </div>
                )}
                {!isLoggedIn && guestUsed && (
                  <p className="text-sm text-amber-600">השתמשת בניסיון החינמי · <Link href="/signup?redirect=/visualize" className="underline">הירשם להדמיות נוספות</Link></p>
                )}
                {isLoggedIn && !hasSubscription && !trialUsed && (
                  <p className="text-sm text-gray-400">ניסיון אחד חינם · ללא כרטיס אשראי</p>
                )}
                {isLoggedIn && !hasSubscription && trialUsed && (
                  <p className="text-sm text-amber-600">השתמשת בניסיון החינמי</p>
                )}
                {isLoggedIn && hasSubscription && vizCredits !== null && vizCredits > 0 && (
                  <p className="text-sm text-gray-400">{vizCredits} הדמיות נותרו</p>
                )}
                {isLoggedIn && hasSubscription && vizCredits === 0 && (
                  <p className="text-sm text-amber-600">נגמרו ההדמיות · <button onClick={() => setShowPacksModal(true)} className="underline font-medium">רכוש חבילה</button></p>
                )}
              </>
            )}
          </div>

          {/* Before → After */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-base font-bold text-gray-400">לפני</span>
            <span className="animate-pulse-arrow text-xl text-emerald-500">←</span>
            <span className="text-base font-bold text-emerald-600">אחרי</span>
          </div>

          {/* Before/After Image - lazy loaded */}
          <div className="relative mx-auto mb-6 max-w-[340px] overflow-hidden rounded-2xl border border-gray-200 shadow-xl sm:max-w-xl md:max-w-2xl">
            <div className="relative aspect-[4/3]">
              <img
                src="/examples/visualize-room-before-v2.jpg"
                alt="לפני השיפוץ"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute inset-0 animate-slide-reveal">
                <img
                  src="/examples/visualize-room-after-v2.jpg"
                  alt="אחרי השיפוץ"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              
              {/* Labels */}
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  לפני
                </span>
              </div>
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-float-badge">
                  אחרי
                </span>
              </div>
              
              {/* Center divider */}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 z-10" />
            </div>
          </div>

          {/* Social proof */}
          <p className="text-sm text-gray-400 mb-2">נועד לתת כיוון לפני ביצוע, לא להחליף בדיקה מקצועית בשטח</p>
        </div>
      </section>

      {/* History Section - Only show if logged in and has history */}
      {isLoggedIn && visualizationHistory.length > 0 && (
        <section className="py-16 px-6 border-b border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
                🕐 ההדמיות שלי
              </h2>
              <p className="text-gray-500">{visualizationHistory.length} הדמיות נשמרו</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {visualizationHistory.slice(0, 6).map((item) => (
                <div 
                  key={item.id}
                  className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 hover:shadow-xl transition-all cursor-pointer active:scale-95"
                  onClick={() => setSelectedHistoryItem(item)}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('למחוק את ההדמיה הזו?')) {
                        deleteFromHistory(item.id);
                      }
                    }}
                    className="absolute top-2 left-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors text-sm"
                    title="מחק הדמיה"
                  >
                    ✕
                  </button>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    <div className="relative aspect-square bg-gray-100">
                      <img 
                        src={item.beforeImage} 
                        alt="לפני" 
                        className="w-full h-full object-cover rounded-lg" 
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">תמונה לא זמינה</div>';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">לפני</span>
                    </div>
                    <div className="relative aspect-square bg-gray-100">
                      <img 
                        src={item.afterImage} 
                        alt="אחרי" 
                        className="w-full h-full object-cover rounded-lg" 
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">תמונה לא זמינה</div>';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">אחרי</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-900 font-medium truncate">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString('he-IL')}
                      </span>
                      {item.costs?.total && (
                        <span className="text-xs text-green-600 font-medium">
                          ₪{item.costs.total.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedHistoryItem(item); }}
                      className="w-full mt-3 bg-gray-900 text-white text-xs py-2 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      📋 ראה פירוט עלויות
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {visualizationHistory.length > 6 && (
              <p className="text-center text-sm text-gray-400 mt-6">
                מציג 6 מתוך {visualizationHistory.length} הדמיות
              </p>
            )}
          </div>
        </section>
      )}

      {/* Examples Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              ראה איך זה עובד
            </h2>
            <p className="text-gray-500">דוגמאות אמיתיות של חדרים שעברו הדמיה</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {EXAMPLES.map((example) => (
              <ExampleCardComponent key={example.id} example={example} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              איך זה עובד?
            </h2>
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

      {/* Pricing Section - Show if not subscribed to Pro */}
      {isLoggedIn && !hasSubscription && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                רוצה להמשיך?
              </h2>
              <p className="text-gray-500">שדרג ל-Pro כדי להמשיך</p>
            </div>
            
            <PricingComparison isLoggedIn={isLoggedIn} />
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              שאלות נפוצות
            </h2>
          </div>
          
          <div className="space-y-6">
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה מדויקת הערכת העלויות?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                ההערכות מבוססות על מחירי שוק מעודכנים ומדויקות ל-±15%. המערכת לוקחת בחשבון את סוג העבודה, חומרים, ואזור גיאוגרפי.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה הדמיות אפשר ליצור?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                עם Pro אפשר ליצור 4 הדמיות שיפוץ AI. צריך עוד? קנה חבילת הדמיות נוספות.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                איך משתפים את ההדמיה עם קבלן?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                כל הדמיה נשמרת אוטומטית בפרויקט שלך. אפשר לשתף באמצעות לינק ישיר או להוריד כ-PDF עם כל פירוט העלויות.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                האם זה עובד עם כל סוג של חדר?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                כן! המערכת עובדת עם כל סוג חדר - סלון, מטבח, חדר שינה, חדר רחצה, מרפסת, ועוד. מומלץ לצלם תמונה ברורה עם תאורה טובה.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">
            {isLoggedIn ? 'מוכן ליצור הדמיה?' : 'מוכן לראות את השיפוץ שלך?'}
          </h2>
          <p className="text-gray-400 mb-8">
            {isLoggedIn ? 'לחץ על הכפתור למעלה והתחל ליצור הדמיות' : 'הצטרף לאלפי משפצים שכבר משתמשים בשירות ההדמיה'}
          </p>
          {!isLoggedIn && (
            <div className="flex gap-4 flex-wrap justify-center">
              <Link
                href="/pricing"
                className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
              >
                הצטרפו ל-ShiputzAI
              </Link>
              <Link
                href="/login"
                className="text-white px-8 py-4 rounded-full text-base border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                יש לי כבר חשבון
              </Link>
            </div>
          )}
          {isLoggedIn && (
            <button
              onClick={handleTryNow}
              className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
            >
              צור הדמיה חדשה
            </button>
          )}
          <p className="text-xs text-white/60 mt-3">{CREDIT_COSTS.visualize} קרדיטים להדמיה</p>
        </div>
      </section>

      {/* Footer */}
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

      {/* Trial Success Modal */}
      {showTrialSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">מעולה!</h3>
            <p className="text-gray-600 mb-4">הניסיון החינמי שלך מופעל</p>
            <p className="text-sm text-gray-400">מעביר אותך להדמיה...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-full animate-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            {!isLoggedIn ? (
              // Guest who used trial - prompt signup
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">אהבת? יש עוד!</h3>
                  <p className="text-gray-500 text-sm">השתמשת בניסיון החינמי. הירשם בחינם וקבל גישה להדמיות נוספות, שמירת היסטוריה, הערכת עלויות ועוד.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/signup?redirect=/visualize"
                    className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
                  >
                    🎉 הירשם בחינם
                  </Link>
                  <Link
                    href="/login?redirect=/visualize"
                    className="block w-full text-center border border-gray-300 text-gray-700 py-4 rounded-full text-base font-medium hover:bg-gray-50 transition-all"
                  >
                    יש לי כבר חשבון
                  </Link>
                </div>
              </>
            ) : hasPurchased ? (
              // User has main subscription - show Vision upgrade
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">הניסיון החינמי נגמר</h3>
                  <p className="text-gray-500 text-sm">שדרג כדי להמשיך ליצור הדמיות</p>
                </div>
                
                <div className="border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-900">תוכניות מנוי</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">החל מ-</span>
                    <span className="text-4xl font-semibold text-gray-900">₪29</span>
                    <span className="text-gray-500 text-sm">/חודש</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">50 קרדיטים · בטלו בכל עת</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">הדמיות שיפוץ AI</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">הערכת עלויות מפורטת</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">כתב כמויות + ניתוח הצעות</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">סריקת קבלות + מעקב תקציב</span>
                  </li>
                </ul>
                
                <Link
                  href="/pricing"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
                >
                  לצפייה בתוכניות ←
                </Link>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  10 קרדיטים חינם · ללא כרטיס אשראי
                </p>
              </>
            ) : (
              // User doesn't have Pro subscription - show upgrade
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-lg">✓</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">שדרגו לתוכנית מנוי</h3>
                  <p className="text-gray-500 text-sm">קרדיטים חודשיים לכל הכלים</p>
                </div>
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">החל מ-</span>
                    <span className="text-4xl font-semibold text-gray-900">₪29</span>
                    <span className="text-gray-500 text-sm">/חודש</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">50 קרדיטים · בטלו בכל עת</p>
                </div>
                
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">הדמיות שיפוץ AI</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">הערכות עלויות מפורטות</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">כתב כמויות + ניתוח הצעות</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">סריקת קבלות + מעקב תקציב</span>
                  </li>
                </ul>
                
                <Link
                  href="/pricing"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-xl text-base font-medium hover:bg-gray-800 transition-all"
                >
                  לצפייה בתוכניות ←
                </Link>
                <p className="text-center text-xs text-gray-400 mt-3">10 קרדיטים חינם · ללא כרטיס אשראי</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Packs Modal - Pro user with 0 credits */}
      {showPacksModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6" onClick={() => setShowPacksModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full relative" dir="rtl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowPacksModal(false)}
              className="absolute top-4 left-4 w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-full text-xl transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-2">
                {packsAnimationData ? (
                  <Lottie animationData={packsAnimationData} loop={true} />
                ) : (
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">נגמרו ההדמיות</h3>
              <p className="text-gray-500 text-sm">רכשו קרדיטים נוספים למנוי כדי להמשיך</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {QUICK_EXTRA_CREDIT_PACKS.map((pack) => (
                <a
                  key={pack.credits}
                  href={`/checkout?credits=${pack.credits}`}
                  className={`block rounded-2xl p-4 relative transition-colors ${
                    pack.variant === "popular"
                      ? "border-2 border-gray-900 hover:bg-gray-50"
                      : pack.variant === "value"
                        ? "border border-green-200 bg-green-50/30 hover:border-green-400"
                        : "border border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {pack.badge && (
                    <div className={`absolute -top-2.5 right-4 text-white text-[10px] font-bold px-3 py-0.5 rounded-full ${
                      pack.variant === "value" ? "bg-green-600" : "bg-gray-900"
                    }`}>
                      {pack.badge}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{pack.credits} קרדיטים</div>
                      <div className={`text-xs ${pack.variant === "value" ? "text-green-600 font-medium" : "text-gray-400"}`}>
                        ₪{getCreditPackUnitPrice(pack.credits)} לקרדיט
                      </div>
                    </div>
                    <div className="text-xl font-bold text-gray-900">₪{getCreditPackPrice(pack.credits)}</div>
                  </div>
                </a>
              ))}
            </div>
            
            <p className="text-center text-xs text-gray-400">קרדיטים נוספים לא מתאפסים · זמין למנויים פעילים</p>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (!generatedResult || showGameLoading) && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/80 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-[calc(env(safe-area-inset-top)+1rem)] backdrop-blur-sm sm:flex sm:items-start sm:justify-center sm:p-6">
          <div className="relative mx-auto w-full max-w-2xl rounded-3xl bg-white p-5 pt-14 shadow-2xl sm:p-8 sm:pt-8">
            <button
              onClick={() => { setShowUploadModal(false); setUploadedImage(null); setDescription(""); setGenerateError(""); }}
              className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 sm:left-4 sm:top-4"
              aria-label="חזרה"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <h3 className="mx-auto max-w-[240px] text-xl font-bold leading-tight text-gray-900 mb-2 sm:max-w-none sm:text-2xl">
                {!isLoggedIn ? 'נסו הדמיה בחינם' : hasSubscription ? 'צור הדמיה חדשה' : 'הניסיון החינמי שלך'}
              </h3>
              <p className="text-gray-500">העלו תמונה של החדר ותאר מה אתה רוצה לשנות</p>
              <p className="text-amber-600 text-sm mt-1">💡 טיפ: העלו תמונה ללא אנשים לתוצאות טובות יותר</p>
            </div>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונת החדר (לפני)</label>
              {!uploadedImage ? (
                <label 
                  className="block cursor-pointer"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="image-upload-label"
                >
                  <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all sm:p-12 ${
                    isDragOver 
                      ? 'border-green-500 bg-green-50 scale-[1.02]' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-4xl mb-4">{isDragOver ? '📥' : '📸'}</div>
                    <p className="text-gray-600 font-medium">
                      {isDragOver ? 'שחרר כאן!' : 'לחץ או גרור תמונה לכאן'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">ללא אנשים בתמונה</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="image-upload-input"
                  />
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
              <div className="mb-3 flex flex-wrap gap-2">
                {VISUALIZE_CONTROL_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setSelectedControlChip(chip.label);
                      setDescription(chip.text);
                    }}
                    className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                      selectedControlChip === chip.label
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-900 hover:text-gray-950"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <textarea
                value={description}
                onChange={(e) => {
                  setSelectedControlChip(null);
                  setDescription(e.target.value);
                }}
                placeholder="למשל: רוצה פרקט במקום אריחים, קירות בגוון אפור, תאורה שקועה, וסגנון מודרני..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none h-24"
                data-testid="description-input"
              />
            </div>
            
            {generateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm" dangerouslySetInnerHTML={{ __html: generateError }} />
            )}
            
            {showGameLoading && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl text-center">
                {/* Flappy Bird mini-game during loading */}
                <FlappyBirdGame 
                  isReady={!!generatedResult} 
                  onShowResult={() => setShowGameLoading(false)} 
                />
                {generating && (
                  <>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {countdown > 0 ? `עוד ${countdown} שניות...` : "לוקח קצת יותר זמן מהרגיל..."}
                    </div>
                    <div className="text-sm text-gray-600 min-h-[40px] flex items-center justify-center">
                      💡 {LOADING_TIPS[currentTip]}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !description || generating}
              className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="generate-button"
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
            
            {!hasSubscription && !trialUsed && (
              <p className="text-center text-xs text-gray-400 mt-4">
                זהו הניסיון החינמי היחיד שלך
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result Modal */}
      {generatedResult && !showGameLoading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl p-6 max-w-5xl w-full relative max-h-[95vh] overflow-auto">
            <button
              onClick={() => { setGeneratedResult(null); setShowUploadModal(false); setUploadedImage(null); setDescription(""); clearProductsCache(); }}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl z-10"
            >
              ✕
            </button>
            
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 ההדמיה שלך מוכנה!</h3>
              <p className="text-xs text-gray-400">הדמיית AI להמחשה בלבד - התוצאה בפועל עשויה להשתנות</p>
            </div>

            <div className="mb-5 hidden md:block">
              <DesignQuestPanel
                productsCount={detectedProducts.length}
                detectingProducts={detectingProducts}
                onShopTheLook={handleShopTheLook}
              />
            </div>
            
            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mb-5 sm:mb-6">
              <div className="relative order-2 md:order-1">
                {(generatedResult.beforeImage || uploadedImage) ? (
                  <>
                    <img src={generatedResult.beforeImage || uploadedImage || ''} alt="לפני" className="w-full rounded-2xl" />
                    <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-full">לפני</span>
                  </>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400">🖼️ תמונת לפני</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                aria-label="פתח Shop the Look לתמונת אחרי"
                className="relative order-1 block cursor-pointer group appearance-none border-0 bg-transparent p-0 text-right md:order-2"
                onClick={handleShopTheLook}
              >
                <img src={generatedResult.image} alt="אחרי" className="w-full rounded-2xl group-hover:brightness-110 transition-all" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי</span>
                <span className="absolute bottom-3 left-3 bg-slate-950 group-hover:bg-emerald-300 group-hover:text-slate-950 text-white text-sm px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg transition-colors">
                  <ShoppingBag className="h-4 w-4" />
                  <span>מצאו פריטים</span>
                </span>
                <span className="absolute bottom-3 right-3 bg-white/95 text-gray-800 text-xs px-3 py-2 rounded-full shadow-md opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                  לחצו למציאת פריטים דומים
                </span>
              </button>
            </div>

            <div className="mb-5 md:hidden">
              <DesignQuestPanel
                productsCount={detectedProducts.length}
                detectingProducts={detectingProducts}
                onShopTheLook={handleShopTheLook}
              />
            </div>
            
            {/* Analysis */}
            {generatedResult.analysis && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">📝 ניתוח מקצועי</h4>
                <div className="text-gray-700 text-sm leading-relaxed space-y-3">
                  {getCleanAnalysisParagraphs(generatedResult.analysis).map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cost Estimate */}
            {generatedResult.costs && generatedResult.costs.total > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">💰 הערכת עלויות</h4>
                <div className="space-y-2">
                  {generatedResult.costs.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description}</span>
                      <span className="font-medium">₪{item.total?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>סה״כ משוער</span>
                    <span className="text-green-600">₪{generatedResult.costs.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-4">
              <a
                href={generatedResult.image}
                download="shiputzai-visualization.png"
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-center font-medium hover:bg-gray-800 transition-all"
              >
                📥 הורד תמונה
              </a>
              <button
                onClick={() => {
                  const shareUrl = currentVisualizationId 
                    ? `https://shipazti.com/share/${currentVisualizationId}`
                    : 'https://shipazti.com/visualize';
                  const text = `תראו מה ShiputzAI עשה לי 😍 הדמיית שיפוץ ב-AI!\n${shareUrl}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 bg-[#25D366] text-white py-3 rounded-full text-center font-medium hover:bg-[#1fbd59] transition-all"
              >
                💬 שתף בוואטסאפ
              </button>
              {!isLoggedIn ? (
                <Link
                  href="/signup?redirect=/visualize"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 rounded-full text-center font-medium hover:from-emerald-600 hover:to-green-600 transition-all"
                >
                  🎉 הירשם בחינם - צור עוד הדמיות
                </Link>
              ) : hasSubscription ? (
                <button
                  onClick={() => { setGeneratedResult(null); setUploadedImage(null); setDescription(""); clearProductsCache(); }}
                  className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-full text-center font-medium hover:bg-gray-50 transition-all"
                >
                  צור הדמיה נוספת
                </button>
              ) : hasPurchased ? (
                <Link
                  href="/pricing"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-full text-center font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  שדרג להדמיות נוספות
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-full text-center font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  🔓 הצטרף ל-ShiputzAI
                </Link>
              )}
            </div>
            {/* Referral CTA */}
            {isLoggedIn && (
              <div className="mt-4 bg-gradient-to-l from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl shrink-0">🎁</span>
                  <p className="text-sm text-gray-700">הזמינו חבר - <strong>שניכם מקבלים 20 קרדיטים</strong></p>
                </div>
                <Link
                  href="/dashboard#referral"
                  className="shrink-0 text-xs font-medium bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all"
                >
                  לקוד שלי
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shop the Look Modal */}
      {showShopModal && generatedResult && (
        <div 
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => {
            setShowShopModal(false);
            setSelectedShopLookProduct(null);
          }}
        >
          <div 
            data-testid="quest-shop-modal"
            className="relative overflow-hidden rounded-[30px] bg-white max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl shadow-black/30"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => {
                setShowShopModal(false);
                setSelectedShopLookProduct(null);
              }}
              className="absolute top-4 right-4 z-20 w-9 h-9 bg-white/95 text-slate-900 rounded-full shadow-lg flex items-center justify-center hover:bg-white"
            >
              ✕
            </button>
            
            <div className="relative overflow-hidden border-b border-slate-200 bg-white p-4 pt-14 text-slate-950 sm:p-6 sm:pt-6">
              <div className="quest-grid-light absolute inset-0 opacity-70" aria-hidden="true" />
              <div className="relative">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                      <Search className="h-3.5 w-3.5" />
                      משימה 2 נפתחה
                    </div>
                    <h3 className="text-2xl font-black leading-tight tracking-normal sm:text-3xl">
                      ציד פריטים מתוך ההדמיה
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                      לחצו על נקודה בתמונה, קראו את שם הפריט המלא, ואז עברו לחיפוש קנייה מדויק.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center sm:block">
                    <div className="text-[10px] font-semibold text-slate-500">נמצאו</div>
                    <div className="text-xl font-black text-emerald-700">{detectedProducts.length}</div>
                  </div>
                </div>
                <DesignQuestPanel
                  productsCount={detectedProducts.length}
                  detectingProducts={detectingProducts}
                  onShopTheLook={detectedProducts.length === 0 ? handleShopTheLook : undefined}
                  compact
                />
              </div>
            </div>

            <div className="p-4 sm:p-5">
              {currentVisualizationId && generatedResult?.image && detectedProducts.length > 0 && (
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => detectProductsForVisualization(generatedResult.image, generatedResult.image, currentVisualizationId)}
                    disabled={detectingProducts}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-emerald-700 shadow-sm ring-1 ring-slate-200 hover:text-emerald-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {detectingProducts && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {detectingProducts ? "סורק מחדש..." : "סרוק מחדש"}
                  </button>
                </div>
              )}
              
              <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-slate-100 shadow-inner">
                <div className="relative flex justify-center">
                  <div ref={shopLookFrameRef} className="relative inline-block max-w-full">
                    <img
                      ref={shopLookImageRef}
                      src={generatedResult.image}
                      alt="אחרי"
                      className="block h-auto w-auto max-h-[58vh] max-w-full"
                      onLoad={updateShopLookImageBox}
                    />
                
                    {detectingProducts && (
                      <div
                        className="absolute flex items-center justify-center bg-slate-950/70"
                        style={{
                          left: shopLookImageBox.left,
                          top: shopLookImageBox.top,
                          width: shopLookImageBox.width || "100%",
                          height: shopLookImageBox.height || "100%",
                        }}
                      >
                    <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-white/10 px-6 py-5 text-center text-white backdrop-blur-md">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-emerald-300/20 animate-quest-scan" />
                      <Loader2 className="mx-auto mb-3 h-9 w-9 animate-spin text-emerald-200" />
                      <p className="text-sm font-black">סורק את החדר...</p>
                      <p className="mt-1 text-xs text-slate-200">מחפש פריטים שאפשר לקנות</p>
                    </div>
                      </div>
                    )}
                
                    {/* Product Hotspots */}
                    <div
                      data-testid="shop-look-hotspot-layer"
                      className="pointer-events-none absolute"
                      style={{
                        left: shopLookImageBox.left,
                        top: shopLookImageBox.top,
                        width: shopLookImageBox.width || "100%",
                        height: shopLookImageBox.height || "100%",
                      }}
                    >
                      {detectedProducts.map((product, index) => {
                        const marker = getShopLookMarkerPosition(product);

                        return (
                          <div
                            key={product.id || index}
                            className="pointer-events-auto absolute"
                            style={{
                              left: `clamp(18px, ${marker.left}%, calc(100% - 18px))`,
                              top: `clamp(18px, ${marker.top}%, calc(100% - 18px))`,
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setSelectedShopLookProduct(current => current?.id === product.id ? null : product)}
                              className="group relative"
                              aria-label={`הצג את הפריט ${product.name}`}
                              aria-pressed={selectedShopLookProduct?.id === product.id}
                            >
                              <div className="absolute inset-0 rounded-full bg-white/45" />
                              <div className={`relative flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-xl transition-transform hover:scale-110 ${selectedShopLookProduct?.id === product.id ? "ring-4 ring-slate-950 scale-110" : "ring-4 ring-teal-200/80"}`}>
                                <Search className="h-3.5 w-3.5 text-teal-700" />
                              </div>
                              <div className="absolute top-11 right-0 bg-white rounded-xl shadow-xl p-3 min-w-[190px] max-w-[260px] z-10 border border-gray-100 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none">
                                <p className="text-sm font-medium text-gray-900 mb-2 leading-snug break-words">{product.name}</p>
                                <span className="text-xs text-emerald-600 font-medium">לחצו להצגת פריט</span>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {selectedShopLookProduct && (
                      <div data-testid="quest-selected-product" className="absolute inset-x-3 bottom-3 z-20 overflow-hidden rounded-[22px] border border-white/20 bg-slate-950/95 text-white shadow-2xl backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setSelectedShopLookProduct(null)}
                      className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                      aria-label="בטל בחירת פריט"
                    >
                      ✕
                    </button>
                    <div className="flex items-start gap-3 p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-slate-950">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-emerald-200">הפריט שנבחר</p>
                        <h4 className="mt-0.5 text-base font-black leading-snug break-words">
                          {selectedShopLookProduct.name}
                        </h4>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 border-t border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-relaxed text-slate-300">
                        קודם קוראים, ורק אז עוברים לחיפוש.
                      </p>
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(selectedShopLookProduct.searchQuery + ' לקנות בישראל')}&tbm=shop`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-300 px-4 py-2.5 text-sm font-black text-slate-950 transition-colors hover:bg-emerald-200 sm:w-auto"
                      >
                        חיפוש בגוגל שופינג
                        <ArrowLeft className="h-4 w-4" />
                      </a>
                    </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!detectingProducts && detectedProducts.length > 0 && (
                <div data-testid="quest-shopping-cta" className="mt-4 rounded-[24px] border border-amber-200 bg-gradient-to-l from-amber-50 via-white to-emerald-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-amber-700 mb-1">משימה 3 נפתחה</p>
                    <h4 className="font-black text-gray-900">בחרו פריט והמשיכו לחיפוש קנייה</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      עכשיו ההמשך טבעי: לוחצים על פריט בתמונה, קוראים את השם המלא, ואז עוברים לחיפוש מדויק.
                    </p>
                  </div>
                  <div className="inline-flex shrink-0 w-full items-center justify-center gap-2 sm:w-auto text-center bg-slate-950 text-white px-5 py-3 rounded-full text-sm font-black">
                    סמנו פריט בתמונה
                    <Search className="h-4 w-4" />
                  </div>
                </div>
              )}
              
              {!detectingProducts && detectedProducts.length === 0 && (
                <div className="text-center mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-gray-600 text-sm">{shopLookError || "לא זוהו מוצרים בתמונה"}</p>
                  {!isLoggedIn && (
                    <Link
                      href="/signup?redirect=/visualize"
                      className="inline-flex mt-3 bg-slate-950 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-all"
                    >
                      הירשמו בחינם להפעלת זיהוי פריטים
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Item Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl p-6 max-w-5xl w-full relative max-h-[95vh] overflow-auto">
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl z-10"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🕐 הדמיה מהיסטוריה</h3>
              <p className="text-sm text-gray-500">
                {new Date(selectedHistoryItem.createdAt).toLocaleDateString('he-IL', { 
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            </div>
            
            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <img src={selectedHistoryItem.beforeImage} alt="לפני" className="w-full rounded-2xl" />
                <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-full">לפני</span>
              </div>
              <button
                type="button"
                aria-label="פתח Shop the Look לתמונת אחרי מההיסטוריה"
                className="relative block cursor-pointer group appearance-none border-0 bg-transparent p-0 text-right"
                onClick={() => {
                  // Set the generated result to the history item so Shop the Look works
                  setGeneratedResult({ image: selectedHistoryItem.afterImage, beforeImage: selectedHistoryItem.beforeImage, analysis: selectedHistoryItem.analysis, costs: selectedHistoryItem.costs });
                  setCurrentVisualizationId(selectedHistoryItem.id);
                  setShopLookError("");
                  setShowShopModal(true);
                  
                  // Products come from cache automatically via currentVisualizationId
                  // If not in cache, scan and save
                  const vizId = selectedHistoryItem.id;
                  const cacheKey = selectedHistoryItem.afterImage;
                  if (!productsCache[cacheKey] || productsCache[cacheKey].length === 0) {
                    detectProductsForVisualization(cacheKey, selectedHistoryItem.afterImage, vizId);
                  }
                }}
              >
                <img src={selectedHistoryItem.afterImage} alt="אחרי" className="w-full rounded-2xl group-hover:brightness-110 transition-all" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי</span>
                <span className="absolute bottom-3 left-3 bg-emerald-500 group-hover:bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg transition-colors">
                  <span>🛒</span>
                  <span>Shop the Look</span>
                </span>
                <span className="absolute bottom-3 right-3 bg-white/95 text-gray-800 text-xs px-3 py-2 rounded-full shadow-md opacity-0 transition-opacity group-hover:opacity-100 sm:opacity-100">
                  לחצו למציאת פריטים דומים
                </span>
              </button>
            </div>
            
            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">📝 מה ביקשת</h4>
              <p className="text-gray-700 text-sm">{selectedHistoryItem.description}</p>
            </div>
            
            {/* Analysis */}
            {selectedHistoryItem.analysis && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">📋 ניתוח מקצועי</h4>
                <div className="text-gray-700 text-sm leading-relaxed space-y-3">
                  {getCleanAnalysisParagraphs(selectedHistoryItem.analysis).map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
            
            {/* Cost Estimate */}
            {selectedHistoryItem.costs?.total > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">💰 הערכת עלויות</h4>
                <div className="space-y-2">
                  {selectedHistoryItem.costs.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description}</span>
                      <span className="font-medium">₪{item.total?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>סה״כ משוער</span>
                    <span className="text-green-600">₪{selectedHistoryItem.costs.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              <a
                href={selectedHistoryItem.afterImage}
                download="shiputzai-visualization.png"
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-center font-medium hover:bg-gray-800 transition-all text-sm"
              >
                📥 הורד
              </a>
              <button
                onClick={() => {
                  const shareUrl = selectedHistoryItem?.id 
                    ? `https://shipazti.com/share/${selectedHistoryItem.id}`
                    : 'https://shipazti.com/visualize';
                  const text = `תראו מה ShiputzAI עשה לי 😍 הדמיית שיפוץ ב-AI!\n${shareUrl}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 bg-[#25D366] text-white py-3 rounded-full text-center font-medium hover:bg-[#1fbd59] transition-all text-sm"
              >
                💬 שתף
              </button>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-full text-center font-medium hover:bg-gray-50 transition-all text-sm"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
