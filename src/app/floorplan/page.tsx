"use client";

import { useState, useRef, useCallback } from "react";

const STYLES = [
  {
    key: "modern-cabin",
    name: "Modern Cabin",
    nameHe: "בקתה מודרנית",
    desc: "עץ חם, קורות חשופות, חלונות גדולים, אווירה רומנטית",
    color: "from-amber-800 to-amber-600",
    emoji: "🏡",
  },
  {
    key: "scandinavian",
    name: "Scandinavian",
    nameHe: "סקנדינבי",
    desc: "מינימליזם, לבן ואלון בהיר, אור טבעי",
    color: "from-gray-200 to-gray-100",
    textDark: true,
    emoji: "🌿",
  },
  {
    key: "industrial",
    name: "Industrial",
    nameHe: "אינדוסטריאלי",
    desc: "לבנים חשופות, מתכת, בטון וריהוט עור",
    color: "from-zinc-800 to-zinc-600",
    emoji: "🏭",
  },
  {
    key: "mediterranean",
    name: "Mediterranean",
    nameHe: "ים-תיכוני",
    desc: "אריחי טרקוטה, קשתות, קירות לבנים",
    color: "from-orange-700 to-yellow-600",
    emoji: "☀️",
  },
  {
    key: "japandi",
    name: "Japandi",
    nameHe: "ג׳פנדי",
    desc: "מינימליזם יפני-סקנדינבי, במבוק ועץ",
    color: "from-stone-700 to-stone-500",
    emoji: "🎋",
  },
  {
    key: "luxury-modern",
    name: "Luxury Modern",
    nameHe: "יוקרה מודרנית",
    desc: "שיש, זהב, ריהוט מעצבים, תאורה דרמטית",
    color: "from-yellow-700 to-yellow-500",
    emoji: "✨",
  },
  {
    key: "boho",
    name: "Bohemian",
    nameHe: "בוהמייני",
    desc: "טקסטילים, שטיחים, ראטאן וצמחייה",
    color: "from-rose-700 to-orange-500",
    emoji: "🌺",
  },
  {
    key: "classic",
    name: "Classic Elegant",
    nameHe: "קלאסי אלגנטי",
    desc: "עיטורים, פרקט, נברשות קריסטל",
    color: "from-indigo-900 to-indigo-700",
    emoji: "👑",
  },
];

export default function FloorplanPage() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadedFile(file);
      setResultImage(null);
      setError(null);
      const reader = new FileReader();
      reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setUploadedFile(file);
    setResultImage(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = async () => {
    if (!uploadedFile || !selectedStyle) return;
    setLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const userStr = localStorage.getItem("user");
      const email = userStr ? JSON.parse(userStr)?.email : null;

      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("style", selectedStyle);
      formData.append("email", email || "");

      const res = await fetch("/api/floorplan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      if (data.image) {
        setResultImage(
          `data:${data.image.mimeType};base64,${data.image.data}`
        );
      }
    } catch (err: any) {
      setError(err.message || "שגיאה ביצירת ההדמיה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" dir="rtl">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 relative">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-sm text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              BETA — גישה מוקדמת
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              מתוכנית קומה ל
              <span className="text-green-400">הדמיה פוטוריאליסטית</span>
              <br />
              בלחיצת כפתור
            </h1>

            <p className="text-white/60 max-w-2xl mx-auto text-lg leading-relaxed">
              העלו תוכנית קומה של הדירה — בחרו סגנון עיצוב — וקבלו הדמיה
              מלמעלה (מבט ציפור) שמראה בדיוק איך הדירה תיראה אחרי השיפוץ.
              בלי הדמיות 3D יקרות, בלי חודשים של עבודה.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl mx-auto">
            {[
              {
                step: "1",
                icon: "📐",
                title: "העלאת תוכנית",
                desc: "תוכנית קומה מהאדריכל או סקיצה",
              },
              {
                step: "2",
                icon: "🎨",
                title: "בחירת סגנון",
                desc: "8 סגנונות עיצוב שונים",
              },
              {
                step: "3",
                icon: "✨",
                title: "קבלת הדמיה",
                desc: "תמונה פוטוריאליסטית תוך שניות",
              },
            ].map((item) => (
              <div key={item.step} className="text-center space-y-2">
                <div className="text-3xl">{item.icon}</div>
                <div className="text-sm font-semibold text-white/90">
                  {item.title}
                </div>
                <div className="text-xs text-white/40">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-10">
        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Step 1: Upload */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center justify-center font-bold">
              1
            </span>
            העלאת תוכנית קומה
          </h2>

          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              uploadedImage
                ? "border-green-500/50 bg-green-500/5"
                : "border-white/20 hover:border-white/40 bg-white/5"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            {uploadedImage ? (
              <div className="space-y-3">
                <img
                  src={uploadedImage}
                  alt="Floor plan"
                  className="max-h-72 mx-auto rounded-lg"
                />
                <p className="text-sm text-white/50">לחץ להחלפה</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-5xl">📐</div>
                <p className="text-white/70 text-lg">
                  גרור תוכנית קומה לכאן או לחץ לבחירה
                </p>
                <p className="text-xs text-white/40">
                  תוכנית אדריכלית, סקיצה, או צילום — PNG, JPG, WEBP
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Step 2: Choose Style */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center justify-center font-bold">
              2
            </span>
            בחירת סגנון עיצוב
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STYLES.map((style) => (
              <button
                key={style.key}
                onClick={() => setSelectedStyle(style.key)}
                className={`relative rounded-xl p-4 text-right transition-all duration-200 border-2 ${
                  selectedStyle === style.key
                    ? "border-green-400 ring-2 ring-green-400/30 scale-[1.02]"
                    : "border-transparent hover:border-white/20"
                } bg-gradient-to-br ${style.color} overflow-hidden`}
              >
                {selectedStyle === style.key && (
                  <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-2xl mb-1">{style.emoji}</div>
                <div
                  className={`font-bold text-sm ${
                    style.textDark ? "text-gray-800" : "text-white"
                  }`}
                >
                  {style.nameHe}
                </div>
                <div
                  className={`text-xs mt-1 leading-tight ${
                    style.textDark ? "text-gray-600" : "text-white/70"
                  }`}
                >
                  {style.desc}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3: Generate */}
        <section>
          <button
            onClick={handleGenerate}
            disabled={!uploadedFile || !selectedStyle || loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              !uploadedFile || !selectedStyle || loading
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                יוצר הדמיה... (עד 30 שניות)
              </span>
            ) : (
              "✨ צור הדמיה"
            )}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Result */}
        {resultImage && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center justify-center font-bold">
                ✓
              </span>
              התוצאה
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-white/50 text-center">
                  תוכנית מקורית
                </p>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  <img
                    src={uploadedImage!}
                    alt="Original floor plan"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-green-400 text-center font-medium">
                  הדמיה —{" "}
                  {STYLES.find((s) => s.key === selectedStyle)?.nameHe}
                </p>
                <div className="rounded-xl overflow-hidden border border-green-500/30 bg-green-500/5">
                  <img
                    src={resultImage}
                    alt="Rendered floor plan"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3">
              <a
                href={resultImage}
                download={`floorplan-${selectedStyle}.png`}
                className="px-6 py-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors"
              >
                📥 הורד תמונה
              </a>
              <button
                onClick={() => {
                  setResultImage(null);
                  setSelectedStyle(null);
                }}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                🔄 נסה סגנון אחר
              </button>
            </div>
          </section>
        )}

        {/* About Section */}
        <div className="border-t border-white/10 pt-10">
          <div className="bg-white/5 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-bold text-green-400">
              איך זה עובד?
            </h3>
            <div className="text-white/70 space-y-3 leading-relaxed">
              <p>
                הכלי משתמש ב-AI מתקדם כדי להפוך תוכנית קומה טכנית להדמיה
                ויזואלית פוטוריאליסטית. ה-AI מנתח את התוכנית — מזהה קירות,
                דלתות, חלונות ומיקום רהיטים — ויוצר תמונה מלמעלה (מבט ציפור)
                שמשמרת את הממדים והפרופורציות המדויקות.
              </p>
              <p>
                בניגוד להדמיות 3D מסורתיות שדורשות שעות עבודה של מעצב,
                כאן התוצאה מגיעה תוך שניות. בחרו סגנון עיצוב — מבקתה
                מודרנית ועד יוקרה קלאסית — ותראו איך הדירה שלכם תיראה
                בסגנון שבחרתם.
              </p>
              <p className="text-white/40 text-sm">
                מושלם לאדריכלים, מעצבי פנים וקבלנים שרוצים להציג ללקוחות
                חזון ברור של הפרויקט.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/20 text-xs pt-4">
          ShiputzAI — Floor Plan Visualizer Beta
        </div>
      </div>
    </div>
  );
}
