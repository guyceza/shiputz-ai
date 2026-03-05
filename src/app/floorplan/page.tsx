"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

const STYLES = [
  {
    key: "modern-cabin",
    name: "Modern Cabin",
    nameHe: "בקתה מודרנית",
    desc: "עץ חם, קורות חשופות, חלונות גדולים",
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
    nameHe: "ג'פנדי",
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

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setResultImage(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

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
      // Get user email from localStorage
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
    <div
      className="min-h-screen bg-[#0a0a0a] text-white"
      dir="rtl"
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <span className="text-green-400">Floor Plan</span> Visualizer
          </h1>
          <span className="text-xs text-white/30">BETA — Internal Only</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
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
                  className="max-h-64 mx-auto rounded-lg"
                />
                <p className="text-sm text-white/50">
                  לחץ להחלפה
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl">📐</div>
                <p className="text-white/70">
                  גרור תוכנית קומה לכאן או לחץ לבחירה
                </p>
                <p className="text-xs text-white/40">
                  PNG, JPG, WEBP
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
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
                יוצר הדמיה...
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
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-green-500/20 text-green-400 text-sm flex items-center justify-center font-bold">
                ✓
              </span>
              תוצאה
            </h2>

            {/* Before / After */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-white/50 text-center">לפני</p>
                <div className="rounded-xl overflow-hidden border border-white/10">
                  <img
                    src={uploadedImage!}
                    alt="Original floor plan"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-green-400 text-center font-medium">
                  ✨ אחרי —{" "}
                  {STYLES.find((s) => s.key === selectedStyle)?.nameHe}
                </p>
                <div className="rounded-xl overflow-hidden border border-green-500/30">
                  <img
                    src={resultImage}
                    alt="Rendered floor plan"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Download */}
            <div className="flex justify-center">
              <a
                href={resultImage}
                download={`floorplan-${selectedStyle}.png`}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
              >
                📥 הורד תמונה
              </a>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
