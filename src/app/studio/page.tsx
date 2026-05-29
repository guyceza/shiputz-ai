"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  ClipboardList,
  Home,
  ImagePlus,
  Layers3,
  Paintbrush,
  PackageSearch,
  SlidersHorizontal,
  Sparkles,
  Wand2,
} from "lucide-react";
import { CREDIT_COSTS, SIGNUP_BONUS_CREDITS } from "@/lib/credit-costs";
import { trackAcquisitionEvent } from "@/lib/acquisition-tracking";

const goals = [
  {
    id: "visualize",
    title: "לעצב חדר מתמונה",
    description: "לפני/אחרי ברור, עם המשך למוצרים ועלויות.",
    prompt: "הדמיית עיצוב פנים לחדר שבתמונה",
    href: "/visualize?studio=1",
  },
  {
    id: "floorplan",
    title: "להפוך תוכנית לחדרים",
    description: "מתוכנית קומה לחדרים, ואז להדמיה ומוצרים.",
    prompt: "הפיכת תוכנית קומה לחדר מעוצב",
    href: "/floorplan?studio=1",
  },
  {
    id: "shop",
    title: "למצוא מוצרים בסגנון",
    description: "זיהוי פריטים וקישורי חיפוש בישראל.",
    prompt: "זיהוי מוצרים וחומרים מתוך תמונת השראה",
    href: "/shop-look?studio=1",
  },
];

const strengths = [
  {
    id: "subtle",
    title: "עדין",
    description: "לשמור על החדר, לשנות צבעים, תאורה וטקסטיל.",
    prompt: "שינוי עדין: לשמור על מבנה החדר והריהוט המרכזי, לשפר צבעים, תאורה, טקסטיל ואווירה.",
  },
  {
    id: "medium",
    title: "בינוני",
    description: "עיצוב מורגש בלי למחוק את המבנה הקיים.",
    prompt: "שינוי בינוני: לשמור על מבנה החדר, אבל להחליף חלק מהריהוט, צבעים, חומרים ותאורה.",
  },
  {
    id: "full",
    title: "מלא",
    description: "כיוון חדש לגמרי, עדיין ריאליסטי לשיפוץ בישראל.",
    prompt: "שינוי מלא: ליצור כיוון עיצוב חדש וריאליסטי, עם ריהוט, חומרים, צבעים ותאורה חדשים.",
  },
];

const directions = [
  {
    id: "warm-modern",
    title: "מודרני חם",
    description: "עץ בהיר, קווים נקיים, תאורה רכה וגוונים טבעיים.",
    prompt: "סגנון מודרני חם עם עץ בהיר, גוונים טבעיים, תאורה רכה וקווים נקיים.",
  },
  {
    id: "israeli-practical",
    title: "פרקטי ישראלי",
    description: "פתרונות שימושיים, חומרים זמינים בארץ ותחזוקה קלה.",
    prompt: "סגנון פרקטי שמתאים לדירה בישראל, עם חומרים זמינים בארץ, תחזוקה קלה וניצול שטח חכם.",
  },
  {
    id: "premium-clean",
    title: "יוקרתי נקי",
    description: "מראה שקט, חומרים איכותיים ונגיעות מלונאיות.",
    prompt: "סגנון יוקרתי נקי עם חומרים איכותיים, תאורה נסתרת, פלטה ניטרלית ונגיעות מלונאיות.",
  },
];

const outcomeCards = [
  { icon: Sparkles, title: "תוצאה ראשונה", text: `ניסיון ראשון חינם ו-${SIGNUP_BONUS_CREDITS} קרדיטים בהרשמה.` },
  { icon: PackageSearch, title: "מוצרים אחרי התוצאה", text: `Shop the Look מחובר להמשך ועולה ${CREDIT_COSTS["shop-look"]} קרדיטים.` },
  { icon: BadgeDollarSign, title: "עלויות בישראל", text: "המשך למחירונים, כתב כמויות וניתוח הצעות בעברית." },
];

const studioSteps = [
  { icon: Home, label: "תמונה" },
  { icon: SlidersHorizontal, label: "עוצמה" },
  { icon: Paintbrush, label: "כיוון" },
  { icon: Wand2, label: "תוצאה" },
];

const getStrengthClass = (isSelected: boolean) =>
  isSelected
    ? "border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100"
    : "border-stone-100 bg-white/80 hover:border-stone-300 hover:bg-white";

const getDirectionClass = (isSelected: boolean) =>
  isSelected
    ? "border-amber-300 bg-amber-50 shadow-sm shadow-amber-100"
    : "border-stone-100 bg-white/80 hover:border-stone-300 hover:bg-white";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function StudioPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [goalId, setGoalId] = useState(goals[0].id);
  const [strengthId, setStrengthId] = useState(strengths[1].id);
  const [directionId, setDirectionId] = useState(directions[0].id);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const selectedGoal = goals.find((goal) => goal.id === goalId) || goals[0];
  const selectedStrength = strengths.find((strength) => strength.id === strengthId) || strengths[1];
  const selectedDirection = directions.find((direction) => direction.id === directionId) || directions[0];

  const studioPrompt = useMemo(() => {
    return [
      selectedGoal.prompt,
      selectedStrength.prompt,
      selectedDirection.prompt,
      note.trim() ? `בקשה נוספת מהמשתמש: ${note.trim()}` : "",
      "להחזיר תוצאה ריאליסטית שמתאימה לשיפוץ ועיצוב בישראל.",
    ]
      .filter(Boolean)
      .join(" ");
  }, [selectedDirection.prompt, selectedGoal.prompt, selectedStrength.prompt, note]);

  const handleImage = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("אפשר להעלות רק קובץ תמונה.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("התמונה גדולה מדי. אפשר עד 10MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageSrc(dataUrl);
      setImageName(file.name);
      setError("");
    } catch {
      setError("לא הצלחתי לקרוא את התמונה. נסו קובץ אחר.");
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem(
        "shiputzai_studio_draft",
        JSON.stringify({
          image: imageSrc,
          prompt: studioPrompt,
          goalId,
          strengthId,
          directionId,
          createdAt: new Date().toISOString(),
        })
      );
    } catch {}

    trackAcquisitionEvent("cta_click", {
      eventName: "studio_continue",
      targetUrl: selectedGoal.href,
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f8f5ef] text-stone-950" dir="rtl">
      <header className="border-b border-black/5 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-base font-bold">
            ShiputzAI
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link href="/visualize" className="rounded-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
              הדמיה
            </Link>
            <Link href="/floorplan" className="rounded-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
              תוכנית קומה
            </Link>
            <Link href="/pricing" className="rounded-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
              מחירים
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-14">
        <div className="space-y-7">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
              <Layers3 className="h-4 w-4" />
              סטודיו אחד לכל המסע
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal text-stone-950 md:text-6xl">
              מתחילים מתמונה, יוצאים עם כיוון ברור לבית.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
              הסטודיו לוקח רגע מבולגן של השראה והופך אותו לבריף נעים: מטרה, עוצמת שינוי, שפה עיצובית והמשך טבעי להדמיה, מוצרים ועלויות.
            </p>
          </div>

          <div className="grid max-w-xl grid-cols-4 rounded-3xl border border-white/70 bg-white/65 p-2 shadow-sm backdrop-blur">
            {studioSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className="relative flex flex-col items-center gap-2 py-3 text-center">
                  {index < studioSteps.length - 1 && <span className="absolute left-[-18%] top-6 hidden h-px w-[36%] bg-stone-200 sm:block" />}
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-950 text-white shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold text-stone-600">{step.label}</span>
                </div>
              );
            })}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {outcomeCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <Icon className="mb-3 h-5 w-5 text-emerald-600" />
                  <div className="text-sm font-bold text-stone-950">{card.title}</div>
                  <p className="mt-1 text-xs leading-5 text-stone-500">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-8 hidden rounded-3xl bg-white p-4 shadow-xl shadow-stone-900/10 md:block">
            <div className="text-xs font-bold text-stone-400">הכיוון שנבחר</div>
            <div className="mt-2 text-sm font-black text-stone-950">{selectedDirection.title}</div>
            <div className="mt-3 flex gap-1.5">
              <span className="h-6 w-6 rounded-full bg-[#d7c0a8]" />
              <span className="h-6 w-6 rounded-full bg-[#f1eadf]" />
              <span className="h-6 w-6 rounded-full bg-[#18211d]" />
            </div>
          </div>
          <div className="absolute -right-5 bottom-8 hidden rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-emerald-900 shadow-xl shadow-emerald-900/10 md:block">
            <div className="flex items-center gap-2 text-sm font-black">
              <CheckCircle2 className="h-4 w-4" />
              מוכן להדמיה
            </div>
            <p className="mt-1 text-xs text-emerald-700">הבריף יעבור אוטומטית</p>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/80 p-3 shadow-2xl shadow-stone-900/10 backdrop-blur md:p-5">
          <div className="grid gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative overflow-hidden rounded-[1.6rem] border border-stone-100 bg-stone-100 text-right transition-all hover:-translate-y-0.5 hover:border-stone-300"
            >
              {imageSrc ? (
                <img src={imageSrc} alt="תמונה שהועלתה לסטודיו" className="h-[24rem] w-full object-cover" />
              ) : (
                <div className="relative h-[24rem] overflow-hidden">
                  <img src="/images/ai-vision/style-match-showcase.jpg" alt="" className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-white/10" />
                  <div className="absolute inset-x-5 bottom-5 rounded-3xl border border-white/25 bg-white/90 p-5 text-center shadow-xl backdrop-blur">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-white">
                      <ImagePlus className="h-6 w-6" />
                    </div>
                    <div className="text-lg font-black text-stone-950">העלו תמונה או השראה</div>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
                      חדר קיים, תמונת השראה או תוכנית. אפשר גם להמשיך בלי תמונה ולהתחיל מהכיוון.
                    </p>
                  </div>
                </div>
              )}
              {imageName && (
                <span className="absolute bottom-3 right-3 max-w-[80%] truncate rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-700 shadow">
                  {imageName}
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handleImage(event.target.files?.[0])}
            />
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-emerald-700">בונים את הכיוון</p>
            <h2 className="mt-1 text-2xl font-black text-stone-950">שלושה צעדים, בלי להרגיש כמו טופס.</h2>
          </div>
          <Link href="/pricing" className="hidden rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow-sm hover:bg-stone-50 md:block">
            ראו עלויות
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-[1.7rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-stone-500" />
            <h2 className="font-bold text-stone-950">1. מה המטרה?</h2>
          </div>
          <div className="space-y-3">
            {goals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => setGoalId(goal.id)}
                className={`w-full rounded-2xl border p-4 text-right transition-all ${
                  goalId === goal.id ? "border-stone-950 bg-stone-950 text-white shadow-lg shadow-stone-900/10" : "border-stone-100 bg-white/80 hover:border-stone-300 hover:bg-white"
                }`}
              >
                <div className="font-bold">{goal.title}</div>
                <p className={`mt-1 text-sm leading-5 ${goalId === goal.id ? "text-stone-300" : "text-stone-500"}`}>
                  {goal.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-stone-500" />
            <h2 className="font-bold text-stone-950">2. כמה לשנות?</h2>
          </div>
          <div className="grid gap-3">
            {strengths.map((strength) => (
              <button
                key={strength.id}
                type="button"
                onClick={() => setStrengthId(strength.id)}
                className={`rounded-2xl border p-4 text-right transition-all ${getStrengthClass(strengthId === strength.id)}`}
              >
                <div className="font-bold text-stone-950">{strength.title}</div>
                <p className="mt-1 text-sm leading-5 text-stone-500">{strength.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-stone-500" />
            <h2 className="font-bold text-stone-950">3. בחרו כיוון</h2>
          </div>
          <div className="space-y-3">
            {directions.map((direction) => (
              <button
                key={direction.id}
                type="button"
                onClick={() => setDirectionId(direction.id)}
                className={`w-full rounded-2xl border p-4 text-right transition-all ${getDirectionClass(directionId === direction.id)}`}
              >
                <div className="font-bold text-stone-950">{direction.title}</div>
                <p className="mt-1 text-sm leading-5 text-stone-500">{direction.description}</p>
              </button>
            ))}
          </div>
        </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-5 rounded-[2rem] border border-white/80 bg-white/80 p-5 shadow-sm backdrop-blur lg:grid-cols-[1fr_0.9fr]">
          <div>
            <label className="mb-2 block text-sm font-bold text-stone-700">בקשה חופשית</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-28 w-full resize-none rounded-2xl border border-stone-200 bg-white/90 px-4 py-3 text-sm outline-none transition-colors focus:border-stone-900"
              placeholder="למשל: לשמור על הספה, להחליף ריצוף, להוסיף אי מטבח, להשתמש בצבעים בהירים..."
            />
          </div>
          <div className="rounded-[1.5rem] bg-stone-950 p-5 text-white shadow-xl shadow-stone-900/10">
            <div className="text-sm font-bold text-emerald-300">הבריף שיעבור לכלי</div>
            <p className="mt-3 max-h-32 overflow-auto text-sm leading-6 text-stone-200">{studioPrompt}</p>
            <Link
              href={selectedGoal.href}
              onClick={saveDraft}
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-stone-950 transition-colors hover:bg-emerald-100"
            >
              המשיכו לתוצאה
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-stone-400">
              בהדמיה, התמונה והבריף יעברו כטיוטה מקומית בדפדפן. בשאר הכלים תמשיכו עם הכיוון שבחרתם.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
