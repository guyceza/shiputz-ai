"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeDollarSign,
  ClipboardList,
  ImagePlus,
  Layers3,
  PackageSearch,
  SlidersHorizontal,
  Sparkles,
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
    <main className="min-h-screen bg-[#f7f6f2] text-gray-950" dir="rtl">
      <header className="border-b border-black/5 bg-white/85 backdrop-blur">
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

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:py-12">
        <div className="space-y-6">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <Layers3 className="h-4 w-4" />
              סטודיו אחד לכל המסע
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-normal text-gray-950 md:text-5xl">
              מעלים תמונה, בוחרים כיוון, וממשיכים לתוצאה.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              במקום לקפוץ בין כלים, הסטודיו מכין בריף אחד שמחבר הדמיה, עוצמת שינוי, מוצרים ועלויות למסלול ברור.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {outcomeCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                  <Icon className="mb-3 h-5 w-5 text-emerald-600" />
                  <div className="text-sm font-bold">{card.title}</div>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-xl shadow-black/5 md:p-6">
          <div className="grid gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-right transition-colors hover:border-gray-900"
            >
              {imageSrc ? (
                <img src={imageSrc} alt="תמונה שהועלתה לסטודיו" className="h-72 w-full object-cover" />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center px-6 text-center">
                  <ImagePlus className="mb-4 h-10 w-10 text-gray-400" />
                  <div className="text-lg font-bold text-gray-900">העלו תמונה או השראה</div>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    חדר קיים, תמונת השראה, או תוכנית. אפשר להתחיל גם בלי תמונה ולעבור לכלי המתאים.
                  </p>
                </div>
              )}
              {imageName && (
                <span className="absolute bottom-3 right-3 max-w-[80%] truncate rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow">
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
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-12 lg:grid-cols-3">
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-gray-500" />
            <h2 className="font-bold">1. מה המטרה?</h2>
          </div>
          <div className="space-y-3">
            {goals.map((goal) => (
              <button
                key={goal.id}
                type="button"
                onClick={() => setGoalId(goal.id)}
                className={`w-full rounded-2xl border p-4 text-right transition-all ${
                  goalId === goal.id ? "border-gray-950 bg-gray-950 text-white" : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="font-bold">{goal.title}</div>
                <p className={`mt-1 text-sm leading-5 ${goalId === goal.id ? "text-gray-300" : "text-gray-500"}`}>
                  {goal.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gray-500" />
            <h2 className="font-bold">2. כמה לשנות?</h2>
          </div>
          <div className="grid gap-3">
            {strengths.map((strength) => (
              <button
                key={strength.id}
                type="button"
                onClick={() => setStrengthId(strength.id)}
                className={`rounded-2xl border p-4 text-right transition-all ${
                  strengthId === strength.id ? "border-emerald-500 bg-emerald-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="font-bold">{strength.title}</div>
                <p className="mt-1 text-sm leading-5 text-gray-500">{strength.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gray-500" />
            <h2 className="font-bold">3. בחרו כיוון</h2>
          </div>
          <div className="space-y-3">
            {directions.map((direction) => (
              <button
                key={direction.id}
                type="button"
                onClick={() => setDirectionId(direction.id)}
                className={`w-full rounded-2xl border p-4 text-right transition-all ${
                  directionId === direction.id ? "border-amber-400 bg-amber-50" : "border-gray-100 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <div className="font-bold">{direction.title}</div>
                <p className="mt-1 text-sm leading-5 text-gray-500">{direction.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="grid gap-5 rounded-3xl border border-black/5 bg-white p-5 shadow-sm lg:grid-cols-[1fr_0.9fr]">
          <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">בקשה חופשית</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="h-28 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-gray-900"
              placeholder="למשל: לשמור על הספה, להחליף ריצוף, להוסיף אי מטבח, להשתמש בצבעים בהירים..."
            />
          </div>
          <div className="rounded-2xl bg-gray-950 p-5 text-white">
            <div className="text-sm font-bold text-emerald-300">הבריף שיעבור לכלי</div>
            <p className="mt-3 max-h-32 overflow-auto text-sm leading-6 text-gray-200">{studioPrompt}</p>
            <Link
              href={selectedGoal.href}
              onClick={saveDraft}
              className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-gray-950 transition-colors hover:bg-emerald-100"
            >
              המשיכו לתוצאה
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="mt-3 text-center text-xs text-gray-400">
              בהדמיה, התמונה והבריף יעברו כטיוטה מקומית בדפדפן. בשאר הכלים תמשיכו עם הכיוון שבחרתם.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
