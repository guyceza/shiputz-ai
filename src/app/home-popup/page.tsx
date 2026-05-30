import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ClipboardCheck,
  ImagePlus,
  LayoutTemplate,
  Ruler,
  Search,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

export const metadata: Metadata = {
  title: "תצוגת פופאפ לעמוד הבית | ShiputzAI",
  robots: {
    index: false,
    follow: false,
  },
};

const quickActions = [
  {
    title: "להדמיית חדר",
    text: "לפני ואחרי מתמונה קיימת",
    href: "/visualize",
    icon: Wand2,
    surface: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  {
    title: "לפענוח תוכנית",
    text: "חדרים, ריהוט וכיוון עבודה",
    href: "/floorplan",
    icon: Ruler,
    surface: "border-sky-200 bg-sky-50 text-sky-800",
  },
  {
    title: "לבדיקת הצעה",
    text: "סעיפים חסרים וחריגות מחיר",
    href: "/quote-analysis",
    icon: ClipboardCheck,
    surface: "border-amber-200 bg-amber-50 text-amber-800",
  },
];

const backgroundSteps = [
  "מעלים תמונה, תוכנית או הצעת מחיר",
  "מקבלים כיוון ברור תוך דקה",
  "ממשיכים להדמיה, מוצרים או עלויות",
];

export default function HomePopupPreviewPage() {
  return (
    <main
      className="min-h-screen overflow-hidden bg-[#f7f3eb] text-stone-950"
      dir="rtl"
    >
      <header className="relative z-20 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-base font-bold">
            ShiputzAI
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/studio"
              className="rounded-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
            >
              סטודיו
            </Link>
            <Link
              href="/visualize"
              className="rounded-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
            >
              הדמיה
            </Link>
            <Link
              href="/pricing"
              className="rounded-full px-3 py-2 text-sm text-stone-600 hover:bg-stone-100"
            >
              מחירים
            </Link>
          </nav>
          <Link
            href="/brand-playground"
            className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            לכיווני דמות
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.2),transparent_28%),radial-gradient(circle_at_60%_90%,rgba(14,165,233,0.14),transparent_32%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-56px)] max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:py-16">
          <div className="space-y-6 opacity-55 blur-[1px]">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-emerald-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              עוזר AI לשיפוץ ועיצוב הבית
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black leading-[1.08] sm:text-6xl">
                לראות, לתכנן ולבדוק שיפוץ לפני שמתחילים.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-stone-700">
                ShiputzAI מחבר בין הדמיית עיצוב, תוכניות קומה, כתב כמויות
                וניתוח הצעות מחיר במקום אחד.
              </p>
            </div>

            <div className="rounded-[8px] border border-emerald-200 bg-white p-2 shadow-[0_18px_50px_rgba(16,185,129,0.16)]">
              <div className="flex min-h-14 items-center gap-3 rounded-[6px] border-2 border-emerald-400 bg-gradient-to-l from-emerald-50 via-white to-amber-50 px-4">
                <Search className="h-5 w-5 shrink-0 text-emerald-700" />
                <p className="min-w-0 flex-1 text-sm font-semibold text-stone-700 sm:text-base">
                  תארו מה אתם רוצים לשנות בבית
                </p>
                <span className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white">
                  להתחיל
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {backgroundSteps.map((step) => (
                <div
                  key={step}
                  className="rounded-[8px] border border-stone-200 bg-white px-4 py-4 text-sm font-semibold leading-6 text-stone-700 shadow-sm"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden opacity-50 blur-[1px] lg:block">
            <div className="relative overflow-hidden rounded-[8px] border border-stone-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
              <Image
                src="/examples/living-after.webp"
                alt="הדמיית סלון אחרי עיצוב"
                width={900}
                height={720}
                priority
                className="h-[520px] w-full rounded-[8px] object-cover"
              />
              <div className="absolute bottom-8 right-8 rounded-[8px] bg-white/92 p-4 shadow-xl backdrop-blur">
                <p className="text-sm font-bold">תוצאה לדוגמה</p>
                <p className="mt-1 text-sm text-stone-600">
                  הדמיה, מוצרים ועלויות באותו רצף
                </p>
              </div>
            </div>
          </div>

          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/32 px-4 py-6 backdrop-blur-[2px]">
            <section
              aria-label="תצוגת פופאפ לעמוד הבית"
              className="grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[8px] border border-white/70 bg-[#fffaf3] shadow-[0_30px_90px_rgba(15,23,42,0.35)] md:grid-cols-[0.95fr_1.05fr]"
            >
              <div className="relative min-h-[260px] overflow-hidden bg-[#fff3e8] md:min-h-[540px]">
                <Image
                  src="/brand-playground/shiputzai-3d-popup-style-v3.png"
                  alt="דמויות תלת ממד ידידותיות לשיפוץ ועיצוב"
                  width={1024}
                  height={1536}
                  priority
                  className="h-full min-h-[300px] w-full object-cover object-top"
                />
                <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-emerald-800 shadow-lg backdrop-blur">
                  דוגמת פופאפ ראשי
                </div>
              </div>

              <div className="relative flex flex-col p-5 sm:p-7">
                <button
                  type="button"
                  aria-label="סגירה"
                  className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 shadow-sm"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-emerald-800">
                  <ImagePlus className="h-4 w-4" />
                  מתחילים מהבית שלכם
                </div>

                <div className="space-y-3">
                  <h2 className="max-w-md text-3xl font-black leading-[1.08] text-stone-950 sm:text-4xl">
                    מה אתם רוצים להבין לפני השיפוץ?
                  </h2>
                  <p className="max-w-md text-base leading-7 text-stone-700">
                    העלו תמונה, תוכנית או הצעת מחיר. נבחר יחד את הכלי הנכון:
                    הדמיה, פענוח תוכנית, מוצרים או בדיקת עלויות.
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  {quickActions.map(({ icon: Icon, ...action }) => (
                    <Link
                      key={action.title}
                      href={action.href}
                      className={`group grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-[8px] border p-3 transition hover:-translate-y-0.5 hover:shadow-md ${action.surface}`}
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-white/80">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-black text-stone-950">
                          {action.title}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-stone-600">
                          {action.text}
                        </span>
                      </span>
                      <ArrowLeft className="h-4 w-4 text-stone-500 transition group-hover:-translate-x-1" />
                    </Link>
                  ))}
                </div>

                <div className="mt-5 rounded-[8px] border border-stone-200 bg-white p-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-stone-950">
                    <LayoutTemplate className="h-4 w-4 text-emerald-700" />
                    או לפתוח סטודיו מלא
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    בחירה אחת שמחברת תמונה, רמת שינוי וסגנון לפני המעבר לכלי.
                  </p>
                  <Link
                    href="/studio"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-stone-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
                  >
                    פתחו סטודיו
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
