"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ImagePlus,
} from "lucide-react";
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
    prompt:
      "שינוי עדין: לשמור על מבנה החדר והריהוט המרכזי, לשפר צבעים, תאורה, טקסטיל ואווירה.",
  },
  {
    id: "medium",
    title: "בינוני",
    description: "עיצוב מורגש בלי למחוק את המבנה הקיים.",
    prompt:
      "שינוי בינוני: לשמור על מבנה החדר, אבל להחליף חלק מהריהוט, צבעים, חומרים ותאורה.",
  },
  {
    id: "full",
    title: "מלא",
    description: "כיוון חדש לגמרי, עדיין ריאליסטי לשיפוץ בישראל.",
    prompt:
      "שינוי מלא: ליצור כיוון עיצוב חדש וריאליסטי, עם ריהוט, חומרים, צבעים ותאורה חדשים.",
  },
];

const directions = [
  {
    id: "warm-modern",
    title: "מודרני חם",
    description: "עץ בהיר, קווים נקיים, תאורה רכה וגוונים טבעיים.",
    prompt:
      "סגנון מודרני חם עם עץ בהיר, גוונים טבעיים, תאורה רכה וקווים נקיים.",
  },
  {
    id: "israeli-practical",
    title: "פרקטי ישראלי",
    description: "פתרונות שימושיים, חומרים זמינים בארץ ותחזוקה קלה.",
    prompt:
      "סגנון פרקטי שמתאים לדירה בישראל, עם חומרים זמינים בארץ, תחזוקה קלה וניצול שטח חכם.",
  },
  {
    id: "premium-clean",
    title: "יוקרתי נקי",
    description: "מראה שקט, חומרים איכותיים ונגיעות מלונאיות.",
    prompt:
      "סגנון יוקרתי נקי עם חומרים איכותיים, תאורה נסתרת, פלטה ניטרלית ונגיעות מלונאיות.",
  },
];

const getStrengthClass = (isSelected: boolean) =>
  isSelected
    ? "border-stone-950 bg-stone-50 shadow-sm"
    : "border-stone-200 bg-white hover:border-stone-500 hover:bg-stone-50";

const getDirectionClass = (isSelected: boolean) =>
  isSelected
    ? "border-stone-950 bg-stone-50 shadow-sm"
    : "border-stone-200 bg-white hover:border-stone-500 hover:bg-stone-50";

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
  const [goalId, setGoalId] = useState<string | null>(null);
  const [strengthId, setStrengthId] = useState<string | null>(null);
  const [directionId, setDirectionId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const selectedGoal = goals.find((goal) => goal.id === goalId) || null;
  const selectedStrength =
    strengths.find((strength) => strength.id === strengthId) || null;
  const selectedDirection =
    directions.find((direction) => direction.id === directionId) || null;
  const activeStep = !selectedGoal
    ? "goal"
    : !selectedStrength
      ? "strength"
      : !selectedDirection
        ? "direction"
        : "ready";
  const isReady = Boolean(
    selectedGoal && selectedStrength && selectedDirection,
  );

  const studioPrompt = useMemo(() => {
    if (!selectedGoal || !selectedStrength || !selectedDirection) return "";

    return [
      selectedGoal.prompt,
      selectedStrength.prompt,
      selectedDirection.prompt,
      note.trim() ? `בקשה נוספת מהמשתמש: ${note.trim()}` : "",
      "להחזיר תוצאה ריאליסטית שמתאימה לשיפוץ ועיצוב בישראל.",
    ]
      .filter(Boolean)
      .join(" ");
  }, [selectedDirection, selectedGoal, selectedStrength, note]);

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
    if (!selectedGoal || !selectedStrength || !selectedDirection) return;

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
        }),
      );
    } catch {}

    trackAcquisitionEvent("cta_click", {
      eventName: "studio_continue",
      targetUrl: selectedGoal.href,
    });
  };

  return (
    <main
      className="min-h-screen overflow-hidden bg-[#f8f5ef] text-stone-950"
      dir="rtl"
    >
      <header className="border-b border-black/5 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="text-base font-bold">
            ShiputzAI
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/visualize"
              className="rounded-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              הדמיה
            </Link>
            <Link
              href="/floorplan"
              className="rounded-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              תוכנית קומה
            </Link>
            <Link
              href="/pricing"
              className="rounded-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
            >
              מחירים
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-14">
        <div className="space-y-7">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-stone-600 shadow-sm">
              סטודיו אחד לכל המסע
            </div>
            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal text-stone-950 md:text-6xl">
              מתחילים מתמונה, יוצאים עם כיוון ברור לבית.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
              מעלים תמונה, בוחרים מטרה אחת, ואז מקבלים רק את הבחירה הבאה שצריך.
              בלי עומס, בלי טופס ארוך על המסך.
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-[2rem] border border-white/80 bg-white/80 p-3 shadow-2xl shadow-stone-900/10 backdrop-blur md:p-5">
            <div className="grid gap-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative overflow-hidden rounded-[1.6rem] border border-stone-100 bg-stone-100 text-right transition-all hover:-translate-y-0.5 hover:border-stone-300"
              >
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt="תמונה שהועלתה לסטודיו"
                    className="h-[24rem] w-full object-cover"
                  />
                ) : (
                  <div className="relative h-[24rem] overflow-hidden">
                    <img
                      src="/images/ai-vision/style-match-showcase.jpg"
                      alt=""
                      className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-white/10" />
                    <div className="absolute inset-x-5 bottom-5 rounded-3xl border border-white/25 bg-white/90 p-5 text-center shadow-xl backdrop-blur">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-950 text-white">
                        <ImagePlus className="h-6 w-6" />
                      </div>
                      <div className="text-lg font-black text-stone-950">
                        העלו תמונה או השראה
                      </div>
                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
                        חדר קיים, תמונת השראה או תוכנית. אפשר גם להמשיך בלי
                        תמונה ולהתחיל מהכיוון.
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
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-8">
        <div className="mb-5">
          <div>
            <p className="text-sm font-bold text-stone-500">בונים את הכיוון</p>
            <h2 className="mt-1 text-2xl font-black text-stone-950">
              בוחרים דבר אחד בכל פעם.
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex flex-wrap gap-2">
            {selectedGoal && (
              <button
                type="button"
                onClick={() => {
                  setGoalId(null);
                  setStrengthId(null);
                  setDirectionId(null);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-bold text-stone-700 hover:border-stone-500 hover:bg-white"
              >
                <Check className="h-3.5 w-3.5" />
                1. {selectedGoal.title}
              </button>
            )}
            {selectedStrength && (
              <button
                type="button"
                onClick={() => {
                  setStrengthId(null);
                  setDirectionId(null);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-bold text-stone-700 hover:border-stone-500 hover:bg-white"
              >
                <Check className="h-3.5 w-3.5" />
                2. {selectedStrength.title}
              </button>
            )}
            {selectedDirection && (
              <button
                type="button"
                onClick={() => setDirectionId(null)}
                className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm font-bold text-stone-700 hover:border-stone-500 hover:bg-white"
              >
                <Check className="h-3.5 w-3.5" />
                3. {selectedDirection.title}
              </button>
            )}
          </div>

          {activeStep === "goal" && (
            <div>
              <h2 className="mb-4 font-bold text-stone-950">
                1. מה רוצים לעשות?
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setGoalId(goal.id)}
                    className="group rounded-xl border border-stone-200 bg-white p-4 text-right transition-colors hover:border-stone-500 hover:bg-stone-50 active:bg-stone-100"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-stone-950">
                        {goal.title}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition-colors group-hover:border-stone-950 group-hover:bg-stone-950 group-hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                      {goal.description}
                    </p>
                    <div className="mt-4 inline-flex rounded-full bg-stone-950 px-3 py-1 text-xs font-bold text-white">
                      בחירה
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeStep === "strength" && (
            <div>
              <h2 className="mb-4 font-bold text-stone-950">2. כמה לשנות?</h2>
              <div className="grid gap-3 md:grid-cols-3">
                {strengths.map((strength) => (
                  <button
                    key={strength.id}
                    type="button"
                    onClick={() => setStrengthId(strength.id)}
                    className={`group rounded-xl border p-4 text-right transition-colors active:bg-stone-100 ${getStrengthClass(strengthId === strength.id)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-stone-950">
                        {strength.title}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition-colors group-hover:border-stone-950 group-hover:bg-stone-950 group-hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                      {strength.description}
                    </p>
                    <div className="mt-4 inline-flex rounded-full bg-stone-950 px-3 py-1 text-xs font-bold text-white">
                      בחירה
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeStep === "direction" && (
            <div>
              <h2 className="mb-4 font-bold text-stone-950">
                3. איזה כיוון עיצובי?
              </h2>
              <div className="grid gap-3 md:grid-cols-3">
                {directions.map((direction) => (
                  <button
                    key={direction.id}
                    type="button"
                    onClick={() => setDirectionId(direction.id)}
                    className={`group rounded-xl border p-4 text-right transition-colors active:bg-stone-100 ${getDirectionClass(directionId === direction.id)}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-stone-950">
                        {direction.title}
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-stone-300 text-stone-700 transition-colors group-hover:border-stone-950 group-hover:bg-stone-950 group-hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-5 text-stone-500">
                      {direction.description}
                    </p>
                    <div className="mt-4 inline-flex rounded-full bg-stone-950 px-3 py-1 text-xs font-bold text-white">
                      בחירה
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeStep === "ready" && (
            <div className="flex flex-col gap-4 border-t border-stone-100 pt-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-bold text-stone-500">
                  הכיוון מוכן
                </div>
                <h2 className="mt-1 text-xl font-black text-stone-950 md:text-2xl">
                  אפשר להוסיף בקשה קצרה ולהמשיך.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGoalId(null);
                  setStrengthId(null);
                  setDirectionId(null);
                }}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow-sm hover:bg-stone-50"
              >
                התחילו מחדש
              </button>
            </div>
          )}
        </div>
      </section>

      {isReady && selectedGoal && (
        <section className="mx-auto max-w-6xl px-5 pb-16">
          <div className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-stone-700">
                בקשה חופשית
              </label>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="h-32 w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-stone-900"
                placeholder="למשל: לשמור על הספה, להחליף ריצוף, להוסיף אי מטבח, להשתמש בצבעים בהירים..."
              />
            </div>
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="text-sm font-bold text-stone-800">
                הבריף שיעבור לכלי
              </div>
              <p className="mt-3 max-h-28 overflow-auto text-sm leading-6 text-stone-600">
                {studioPrompt}
              </p>
              <Link
                href={selectedGoal.href}
                onClick={saveDraft}
                className="mt-5 flex h-11 items-center justify-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-bold text-white transition-colors hover:bg-stone-800"
              >
                המשיכו לתוצאה
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs leading-5 text-stone-500">
                בהדמיה, התמונה והבריף יעברו כטיוטה מקומית בדפדפן. בשאר הכלים
                תמשיכו עם הכיוון שבחרתם.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
