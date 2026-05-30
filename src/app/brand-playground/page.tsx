import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Home,
  ImagePlus,
  MessageCircle,
  Paintbrush,
  Ruler,
  Search,
  Sofa,
  Sparkles,
  Wand2,
} from "lucide-react";

const characterDirections = [
  {
    name: "שיפוצניק חכם",
    role: "מדריך פרקטי",
    tone: "ישיר, שימושי, נותן תחושת ביטחון לפני החלטות.",
    accent: "from-emerald-300 to-lime-200",
    face: "bg-emerald-900",
    shirt: "bg-emerald-600",
    chip: "הכי מותגי",
  },
  {
    name: "מעצבת רגועה",
    role: "מלווה אסתטית",
    tone: "רכה יותר, מתאימה להדמיות ולבחירת סגנון.",
    accent: "from-rose-200 to-amber-200",
    face: "bg-stone-800",
    shirt: "bg-rose-500",
    chip: "יותר ביתי",
  },
  {
    name: "מודד תוכניות",
    role: "איש מקצוע מדויק",
    tone: "מתאים לתוכניות קומה, כתבי כמויות ועלויות.",
    accent: "from-sky-200 to-cyan-100",
    face: "bg-slate-800",
    shirt: "bg-sky-600",
    chip: "יותר מקצועי",
  },
  {
    name: "עוזרת AI",
    role: "דמות מוצרית",
    tone: "משחקית יותר, אבל עדיין נקייה ולא ילדותית.",
    accent: "from-violet-200 to-emerald-100",
    face: "bg-violet-900",
    shirt: "bg-violet-600",
    chip: "יותר משחקי",
  },
];

const intentIcons = [
  {
    icon: Wand2,
    title: "לראות שינוי",
    text: "הדמיה לפני/אחרי מחדר אמיתי.",
    color: "text-emerald-700 bg-emerald-50 border-emerald-100",
  },
  {
    icon: Ruler,
    title: "להבין תוכנית",
    text: "חדרים, ריהוט וכיוון עבודה.",
    color: "text-sky-700 bg-sky-50 border-sky-100",
  },
  {
    icon: Sofa,
    title: "למצוא מוצרים",
    text: "רעיונות שמתאימים לסגנון.",
    color: "text-amber-700 bg-amber-50 border-amber-100",
  },
  {
    icon: ClipboardCheck,
    title: "לבדוק הצעה",
    text: "מה חסר, יקר או לא ברור.",
    color: "text-rose-700 bg-rose-50 border-rose-100",
  },
];

const samplePrompts = [
  "אני רוצה סלון מודרני חם, בלי להחליף את כל הריהוט",
  "תסביר לי מה אפשר לעשות עם התוכנית הזאת",
  "מצא לי מוצרים דומים למה שמופיע בתמונה",
];

function CharacterCard({
  direction,
}: {
  direction: (typeof characterDirections)[number];
}) {
  return (
    <article className="rounded-[8px] border border-stone-200 bg-white p-4 shadow-sm">
      <div
        className={`relative mb-4 flex aspect-[4/3] items-end justify-center overflow-hidden rounded-[8px] bg-gradient-to-br ${direction.accent}`}
      >
        <div className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-stone-700 backdrop-blur">
          {direction.chip}
        </div>
        <div className="relative mb-5 h-28 w-24">
          <div
            className={`absolute bottom-0 left-1/2 h-16 w-24 -translate-x-1/2 rounded-t-[34px] ${direction.shirt}`}
          />
          <div className="absolute bottom-11 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-[#f1c49d] shadow-lg">
            <div className="absolute left-4 top-8 h-2 w-2 rounded-full bg-stone-900" />
            <div className="absolute right-4 top-8 h-2 w-2 rounded-full bg-stone-900" />
            <div className="absolute bottom-5 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-white/80" />
          </div>
          <div
            className={`absolute bottom-[94px] left-1/2 h-9 w-16 -translate-x-1/2 rounded-t-full ${direction.face}`}
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
          {direction.role}
        </p>
        <h2 className="text-lg font-bold text-stone-950">{direction.name}</h2>
        <p className="text-sm leading-6 text-stone-600">{direction.tone}</p>
      </div>
    </article>
  );
}

export default function BrandPlaygroundPage() {
  return (
    <main className="min-h-screen bg-[#f8f5ef] text-stone-950" dir="rtl">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-base font-bold">
            ShiputzAI
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            חזרה לאתר
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-14">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm">
            <Sparkles className="h-4 w-4" />
            דף טסט פנימי לכיוון מותג משחקי
          </div>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-black leading-[1.08] text-stone-950 sm:text-5xl">
              בודקים אם ShiputzAI יכול להרגיש יותר חי, בלי להפוך לילדותי.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-stone-700">
              ניסוי חזותי לדמויות, חיפוש עם מסגרת צבעונית, אייקוני כוונה
              ברורים וטקסטים שמדברים כמו עוזר אישי לשיפוץ.
            </p>
          </div>

          <div className="rounded-[8px] border border-emerald-200 bg-white p-2 shadow-[0_18px_50px_rgba(16,185,129,0.16)]">
            <div className="flex min-h-14 items-center gap-3 rounded-[6px] border-2 border-emerald-400 bg-gradient-to-l from-emerald-50 via-white to-amber-50 px-4">
              <Search className="h-5 w-5 shrink-0 text-emerald-700" />
              <p className="min-w-0 flex-1 text-sm font-semibold text-stone-700 sm:text-base">
                תארו מה אתם רוצים לשנות בבית
              </p>
              <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700">
                להתחיל
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {samplePrompts.map((prompt) => (
              <div
                key={prompt}
                className="rounded-[8px] border border-stone-200 bg-white px-3 py-3 text-sm leading-6 text-stone-700 shadow-sm"
              >
                {prompt}
              </div>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[8px] border border-stone-200 bg-white shadow-sm">
          <Image
            src="/examples/living-after.webp"
            alt="סלון אחרי הדמיה"
            width={900}
            height={720}
            priority
            className="h-[460px] w-full object-cover"
          />
          <div className="absolute bottom-4 right-4 max-w-[82%] rounded-[8px] bg-white/92 p-4 shadow-xl backdrop-blur">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-stone-950">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              כך זה יכול להרגיש באתר
            </div>
            <p className="text-sm leading-6 text-stone-700">
              יותר משחקי ברגע הבחירה, אבל התוצאה עדיין נשארת נקייה, פרקטית
              ומחוברת לשיפוץ אמיתי.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold text-emerald-700">
                כיווני דמויות
              </p>
              <h2 className="mt-2 text-3xl font-black text-stone-950">
                ארבעה טעמים, לא החלטה סופית
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-stone-600">
              המטרה היא לבדוק תחושה: מה מוסיף חמימות ומה עלול לקחת את המותג
              רחוק מדי.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {characterDirections.map((direction) => (
              <CharacterCard key={direction.name} direction={direction} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <p className="text-sm font-bold text-emerald-700">
              אייקוני כוונה
            </p>
            <h2 className="text-3xl font-black text-stone-950">
              במקום לשאול איזה כלי צריך, שואלים מה רוצים להשיג.
            </h2>
            <p className="text-base leading-7 text-stone-700">
              זה יכול להפוך את האתר לפחות טכני: המשתמש בוחר כוונה, והמערכת
              מחברת אותו לכלי הנכון.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {intentIcons.map(({ icon: Icon, title, text, color }) => (
              <article
                key={title}
                className={`rounded-[8px] border p-4 shadow-sm ${color}`}
              >
                <Icon className="mb-4 h-7 w-7" />
                <h3 className="text-lg font-black text-stone-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-stone-700">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-950 text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 lg:grid-cols-3">
          <article className="rounded-[8px] border border-white/10 bg-white/7 p-5">
            <ImagePlus className="mb-4 h-7 w-7 text-emerald-300" />
            <h3 className="text-xl font-black">העלאה מרגישה כמו התחלה</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              במקום טופס קר, מעלים תמונה ומקבלים תגובה אנושית יותר.
            </p>
          </article>
          <article className="rounded-[8px] border border-white/10 bg-white/7 p-5">
            <MessageCircle className="mb-4 h-7 w-7 text-amber-300" />
            <h3 className="text-xl font-black">הטקסט קצר ואקטיבי</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              שפה של פעולה: לראות, להבין, למצוא, לבדוק.
            </p>
          </article>
          <article className="rounded-[8px] border border-white/10 bg-white/7 p-5">
            <Home className="mb-4 h-7 w-7 text-sky-300" />
            <h3 className="text-xl font-black">עדיין שיפוץ, לא משחק</h3>
            <p className="mt-3 text-sm leading-7 text-white/70">
              משתמשים בצבע ודמויות כדי להוריד פחד, לא כדי להחליף אמינות.
            </p>
          </article>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
        <span>דף פנימי לבדיקת כיוון ויזואלי.</span>
        <span className="inline-flex items-center gap-2 text-stone-700">
          <Paintbrush className="h-4 w-4" />
          /brand-playground
        </span>
      </footer>
    </main>
  );
}
