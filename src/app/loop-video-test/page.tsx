import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Film,
  Play,
  Sparkles,
  Wand2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "תצוגת סרטון לופ | ShiputzAI",
  robots: {
    index: false,
    follow: false,
  },
};

const checks = [
  "קובץ וידאו אמיתי, לא דמו CSS",
  "מושתק, חוזר בלופ ומתאים לאוטופליי",
  "נכס מתוך עולם ShiputzAI בלבד",
];

export default function LoopVideoTestPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ed] text-stone-950" dir="rtl">
      <header className="border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-base font-black">
            ShiputzAI
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-stone-800"
          >
            חזרה לאתר
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:py-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm font-bold text-emerald-800 shadow-sm">
            <Sparkles className="h-4 w-4" />
            דף טסט מוסתר לסרטון חוזר
          </div>

          <div className="space-y-4">
            <h1 className="max-w-xl text-4xl font-black leading-[1.08] text-stone-950 sm:text-5xl">
              בדיקת לופ ויזואלי לעמודי ShiputzAI.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-700">
              הטסט בודק אם סרטון קצר של לפני/אחרי יכול להוסיף חיים לעמוד בלי
              להרגיש כמו פרסומת רועשת או להכביד על הטעינה.
            </p>
          </div>

          <div className="grid gap-3">
            {checks.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-[8px] border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700 shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/visualize"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
            >
              לראות את כלי ההדמיה
              <Wand2 className="h-4 w-4" />
            </Link>
            <a
              href="/loop-tests/shiputzai-before-after-loop.mp4"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800 transition hover:bg-stone-50"
            >
              קובץ וידאו ישיר
              <Film className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[8px] border border-stone-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.16)]">
          <video
            autoPlay
            loop
            muted
            playsInline
            controls
            preload="metadata"
            poster="/examples/visualize-room-after-v2.jpg"
            className="aspect-video w-full rounded-[6px] bg-stone-900 object-cover"
          >
            <source
              src="/loop-tests/shiputzai-before-after-loop.mp4"
              type="video/mp4"
            />
          </video>

          <div className="pointer-events-none absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm font-black text-stone-950 shadow-lg backdrop-blur">
            <Play className="h-4 w-4 fill-emerald-600 text-emerald-600" />
            לפני / אחרי
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold text-emerald-700">פורמט</p>
            <p className="mt-2 text-2xl font-black text-stone-950">
              1280x720
            </p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              יחס רחב שמתאים לבדיקה ראשונה באזורי הירו ובכרטיסי תצוגה.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">משך</p>
            <p className="mt-2 text-2xl font-black text-stone-950">9.6 שניות</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              כולל חזרה פנימית להתחלה כדי שהלופ ירגיש חלק יותר.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-700">שימוש אפשרי</p>
            <p className="mt-2 text-2xl font-black text-stone-950">בדיקת תחושה</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              אם הכיוון עובד, אפשר לייצר גרסה ייעודית יותר לכלי או לעמוד הבית.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
