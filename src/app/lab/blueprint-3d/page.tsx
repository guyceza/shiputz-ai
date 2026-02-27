"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

// Dynamic import for Three.js viewer (client-side only)
const Room3DViewer = dynamic(() => import("@/components/Room3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="animate-spin text-4xl">🏠</div>
    </div>
  ),
});

type Step = "landing" | "upload" | "analyzing" | "generating" | "walkthrough";

export default function BlueprintTo3DPage() {
  const [step, setStep] = useState<Step>("landing");
  const [blueprintImage, setBlueprintImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [gltfData, setGltfData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setBlueprintImage(e.target?.result as string);
      setError(null);
      // Auto-start analysis
      handleAnalyze(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (imageData: string) => {
    setStep("analyzing");
    setProgress("מנתח את התוכנית האדריכלית...");
    setError(null);

    try {
      // Step 1: Analyze blueprint with Gemini
      const analyzeRes = await fetch("/api/lab/analyze-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "שגיאה בניתוח התוכנית");
      }

      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData);
      
      // Step 2: Generate GLTF
      setStep("generating");
      setProgress("בונה מודל תלת-ממדי...");

      const gltfRes = await fetch("/api/lab/render-gltf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomData: analyzeData }),
      });

      if (!gltfRes.ok) {
        throw new Error("שגיאה ביצירת המודל התלת-ממדי");
      }

      const gltfResult = await gltfRes.json();
      
      // Convert base64 to blob URL
      const binaryString = atob(gltfResult.gltf);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "model/gltf-binary" });
      const url = URL.createObjectURL(blob);
      setGltfData(url);
      
      setStep("walkthrough");
      setProgress("");
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "שגיאה לא צפויה");
      setStep("upload");
    }
  };

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (gltfData) {
        URL.revokeObjectURL(gltfData);
      }
    };
  }, [gltfData]);

  const houseBounds = analysis?.rooms?.reduce((bounds: any, room: any) => {
    const pos = room.position || { x: 0, y: 0 };
    const maxX = pos.x + room.width;
    const maxY = pos.y + room.length;
    return {
      width: Math.max(bounds.width, maxX),
      length: Math.max(bounds.length, maxY),
    };
  }, { width: 0, length: 0 }) || { width: 10, length: 10 };

  // Landing page
  if (step === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900" dir="rtl">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero */}
            <div className="mb-12">
              <span className="text-6xl mb-6 block">🏠</span>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                תוכנית → סיור וירטואלי
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                העלו תוכנית אדריכלית וטיילו בתוך הבית בתלת-ממד
              </p>
            </div>

            {/* How it works */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur">
                <div className="text-4xl mb-4">📐</div>
                <h3 className="text-lg font-semibold text-white mb-2">1. העלו תוכנית</h3>
                <p className="text-gray-400 text-sm">
                  צלמו או העלו תוכנית אדריכלית של הדירה/בית
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-white mb-2">2. AI מנתח</h3>
                <p className="text-gray-400 text-sm">
                  הבינה המלאכותית מזהה חדרים, מידות ופתחים
                </p>
              </div>
              <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur">
                <div className="text-4xl mb-4">🚶</div>
                <h3 className="text-lg font-semibold text-white mb-2">3. טיילו בפנים</h3>
                <p className="text-gray-400 text-sm">
                  סיור וירטואלי אינטראקטיבי בתוך הבית
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep("upload")}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white text-xl font-semibold rounded-2xl transition-all transform hover:scale-105 shadow-lg shadow-blue-600/30"
            >
              🚀 בואו נתחיל!
            </button>

            {/* Demo link */}
            <p className="mt-8 text-gray-500">
              רוצים לראות דוגמה קודם?{" "}
              <a href="/lab/blueprint-3d/demo" className="text-blue-400 hover:text-blue-300 underline">
                סיור בבית לדוגמה
              </a>
            </p>

            {/* Lab badge */}
            <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full">
              <span>🧪</span>
              <span className="text-yellow-500 text-sm">תכונה ניסיונית - LAB</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Upload step
  if (step === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center" dir="rtl">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setStep("landing")}
              className="mb-6 text-gray-400 hover:text-white flex items-center gap-2"
            >
              ← חזרה
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 text-center">העלו תוכנית אדריכלית</h2>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
                <p>{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="mt-2 text-sm underline"
                >
                  נסה שוב
                </button>
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-2xl transition-colors flex flex-col items-center justify-center gap-4 bg-gray-800/30"
            >
              <span className="text-6xl">📐</span>
              <span className="text-gray-300 text-lg">לחצו לצילום או העלאת תוכנית</span>
              <span className="text-gray-500 text-sm">תמונה של תוכנית אדריכלית</span>
            </button>

            <p className="mt-6 text-center text-gray-500 text-sm">
              💡 טיפ: תוכניות עם מידות כתובות יתנו תוצאות טובות יותר
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Analyzing / Generating step
  if (step === "analyzing" || step === "generating") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-6">
            {step === "analyzing" ? "🔍" : "🏗️"}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{progress}</h2>
          <p className="text-gray-400">אנא המתינו...</p>
          
          {blueprintImage && (
            <div className="mt-8 max-w-xs mx-auto">
              <img 
                src={blueprintImage} 
                alt="תוכנית" 
                className="rounded-xl opacity-50 max-h-48 mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Walkthrough step
  if (step === "walkthrough" && gltfData) {
    return (
      <div className="fixed inset-0 bg-black" dir="rtl">
        {/* Exit button */}
        <button
          onClick={() => {
            if (gltfData) URL.revokeObjectURL(gltfData);
            setGltfData(null);
            setAnalysis(null);
            setBlueprintImage(null);
            setStep("landing");
          }}
          className="absolute top-4 left-4 z-30 bg-gray-900/80 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          ✕ סיום
        </button>

        {/* Room info */}
        {analysis && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-gray-900/80 text-white px-4 py-2 rounded-lg text-sm">
            {analysis.rooms?.length} חדרים • {analysis.totalArea || "~"} מ״ר
          </div>
        )}

        {/* 3D Viewer */}
        <Room3DViewer
          modelUrl={gltfData}
          houseWidth={houseBounds.width}
          houseLength={houseBounds.length}
        />
      </div>
    );
  }

  // Fallback
  return null;
}
// Deploy trigger: Fri Feb 27 19:10:34 UTC 2026
