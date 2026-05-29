"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calculator, ClipboardList, FileCheck2, Film, Home, Layers3, ShieldCheck } from "lucide-react";

const visualExamples = [
  {
    title: "סלון",
    before: "/examples/visualize-room-before-v2.jpg",
    after: "/examples/visualize-room-after-v2.jpg",
    note: "בודקים צבע, ריהוט ותאורה לפני שקונים.",
  },
  {
    title: "מטבח",
    before: "/examples/kitchen-before.jpg",
    after: "/examples/kitchen-after.jpg",
    note: "רואים כיוון עיצובי לפני הזמנת נגרות ושיש.",
  },
  {
    title: "חדר שינה",
    before: "/examples/bedroom-before.jpg",
    after: "/examples/bedroom-after.jpg",
    note: "משווים סגנון, ריצוף ואחסון בלי לנחש.",
  },
];

const decisions = [
  {
    title: "רואים",
    text: "תמונה קיימת הופכת לכיוון ויזואלי ברור.",
    icon: Home,
  },
  {
    title: "מבינים מחיר",
    text: "מחברים את הרעיון לטווחי מחיר ישראליים.",
    icon: Calculator,
  },
  {
    title: "בודקים קבלן",
    text: "מזהים חריגות וסעיפים חסרים בהצעה.",
    icon: FileCheck2,
  },
  {
    title: "יוצאים עם דוח",
    text: "כתב כמויות ושאלות שאפשר לשלוח הלאה.",
    icon: ClipboardList,
  },
];

function HeroComparison() {
  const [position, setPosition] = useState(56);

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/15 bg-white/10 shadow-2xl shadow-black/30">
      <div className="relative aspect-[4/5] sm:aspect-[16/11]">
        <Image
          src="/examples/visualize-room-before-v2.jpg"
          alt="חדר לפני הדמיית שיפוץ"
          fill
          priority
          className="object-cover"
          sizes="(min-width: 1024px) 48vw, 100vw"
        />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Image
            src="/examples/visualize-room-after-v2.jpg"
            alt="חדר אחרי הדמיית שיפוץ"
            fill
            priority
            className="object-cover"
            sizes="(min-width: 1024px) 48vw, 100vw"
          />
        </div>
        <div className="absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_30px_rgba(255,255,255,0.9)]" style={{ left: `${position}%` }} />
        <div className="absolute right-4 top-4 z-10 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
          לפני
        </div>
        <div className="absolute left-4 top-4 z-10 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-black text-slate-950 shadow-lg">
          אחרי
        </div>
        <input
          aria-label="גרירת השוואת לפני ואחרי"
          type="range"
          min="18"
          max="82"
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          className="absolute inset-x-6 bottom-5 z-20 h-1 accent-emerald-300"
        />
      </div>
    </div>
  );
}

export default function VisualRenovationLandingPage() {
  return (
    <main className="min-h-screen bg-[#0b0b0a] text-white" dir="rtl">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0b0b0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="text-sm font-semibold tracking-normal text-white">
            ShiputzAI
          </Link>
          <Link href="/visualize" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-100">
            התחילו הדמיה
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-5 pb-14 pt-24 sm:pb-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.22),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(245,158,11,0.16),transparent_32%)]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              לפני ששוברים קיר, רואים את הכיוון
            </p>
            <h1 className="text-4xl font-black leading-[1.06] tracking-normal sm:text-6xl">
              ראו את השיפוץ לפני שמתחילים.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/68">
              העלו תמונה של חדר וקבלו הדמיית לפני/אחרי, כיוון תקציבי והמשך ברור לבדיקה מול קבלן. פחות ניחושים, יותר החלטות.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/visualize" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-7 py-4 text-base font-black text-slate-950 shadow-xl shadow-emerald-950/30 transition-transform hover:-translate-y-0.5 hover:bg-emerald-200">
                נסו הדמיה עכשיו
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Link href="/quote-analysis" className="inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10">
                בדיקת הצעת מחיר
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3 text-center text-xs text-white/58">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">ללא כרטיס לניסיון</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">מבוסס מחירי ישראל</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-3">שומר מבנה ככל האפשר</div>
            </div>
          </div>
          <HeroComparison />
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.04] px-5 py-10">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-4">
          {decisions.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-white/60">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-5 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-emerald-200">דוגמאות אמיתיות</p>
              <h2 className="mt-2 text-3xl font-black tracking-normal text-white">שלושה חדרים. החלטה אחת ברורה.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/58">
              ה-PMax צריך למכור את הרגע שבו המשתמש רואה את הבית העתידי שלו, ואז מובילים אותו לכלים המקצועיים.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {visualExamples.map((example) => (
              <Link key={example.title} href="/visualize" className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] transition-transform hover:-translate-y-1">
                <div className="grid grid-cols-2 gap-1 p-2">
                  <div className="relative aspect-square overflow-hidden rounded-2xl">
                    <Image src={example.before} alt={`${example.title} לפני`} fill className="object-cover" sizes="33vw" />
                    <span className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">לפני</span>
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-2xl">
                    <Image src={example.after} alt={`${example.title} אחרי`} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="33vw" />
                    <span className="absolute bottom-2 right-2 rounded-full bg-emerald-300 px-2 py-1 text-[11px] font-black text-slate-950">אחרי</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black">{example.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{example.note}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20">
        <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-white text-slate-950 md:grid-cols-[0.9fr_1.1fr]">
          <div className="p-8 sm:p-10">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              <Layers3 className="h-4 w-4" />
              לא עוד מחולל תמונות
            </p>
            <h2 className="text-3xl font-black tracking-normal">הדמיה היא רק השלב הראשון.</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              אחרי שהתמונה ברורה, ממשיכים למחיר, הצעת קבלן וכתב כמויות. זה ההבדל בין השראה נחמדה לבין החלטה שאפשר לפעול לפיה.
            </p>
            <Link href="/visualize" className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-black text-white hover:bg-slate-800">
              התחילו מהדמיה
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-px bg-slate-200 md:grid-cols-2">
            <Link href="/floorplan" className="bg-slate-50 p-7 transition-colors hover:bg-emerald-50">
              <Film className="mb-5 h-7 w-7 text-emerald-700" />
              <h3 className="font-black">תוכנית קומה להדמיה</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">מהשרטוט לחדר שאפשר לדמיין.</p>
            </Link>
            <Link href="/quote-analysis" className="bg-slate-50 p-7 transition-colors hover:bg-amber-50">
              <FileCheck2 className="mb-5 h-7 w-7 text-amber-700" />
              <h3 className="font-black">בדיקת הצעת קבלן</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">סעיפים חשודים, חריגות ושאלות למיקוח.</p>
            </Link>
            <Link href="/dashboard/bill-of-quantities" className="bg-slate-50 p-7 transition-colors hover:bg-sky-50">
              <ClipboardList className="mb-5 h-7 w-7 text-sky-700" />
              <h3 className="font-black">כתב כמויות</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">דוח שאפשר לשלוח לקבלן.</p>
            </Link>
            <Link href="/pricing-guide" className="bg-slate-50 p-7 transition-colors hover:bg-rose-50">
              <Calculator className="mb-5 h-7 w-7 text-rose-700" />
              <h3 className="font-black">מחירון שיפוץ</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">טווחי מחיר כדי להבין אם ההצעה הגיונית.</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
