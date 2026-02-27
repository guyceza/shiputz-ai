"use client";

import { useState, useRef } from "react";
import Image from "next/image";

export default function BlueprintTo3DPage() {
  const [blueprintImage, setBlueprintImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [render3D, setRender3D] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "analyzing" | "rendering" | "done">("upload");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      setBlueprintImage(e.target?.result as string);
      setAnalysis(null);
      setRender3D(null);
      setError(null);
      setStep("upload");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!blueprintImage) return;

    setLoading(true);
    setError(null);
    setStep("analyzing");

    try {
      // Step 1: Analyze blueprint with Gemini
      const analyzeRes = await fetch("/api/lab/analyze-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: blueprintImage }),
      });

      if (!analyzeRes.ok) {
        throw new Error("שגיאה בניתוח התוכנית");
      }

      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData);
      setStep("rendering");

      // Step 2: Generate 3D render with Blender
      const renderRes = await fetch("/api/lab/render-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomData: analyzeData }),
      });

      if (!renderRes.ok) {
        throw new Error("שגיאה ביצירת ההדמיה");
      }

      const renderData = await renderRes.json();
      setRender3D(renderData.image);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "שגיאה לא צפויה");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">תוכנית → הדמיית 3D</h1>
        <p className="text-gray-400 mb-8">
          העלו תוכנית אדריכלית ונהפוך אותה להדמיה תלת-ממדית
        </p>

        {/* Upload area */}
        <div className="mb-8">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!blueprintImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-64 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center gap-4"
            >
              <span className="text-5xl">📐</span>
              <span className="text-gray-400">לחצו להעלאת תוכנית אדריכלית</span>
            </button>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Blueprint */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">תוכנית מקור</h3>
                <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
                  <img
                    src={blueprintImage}
                    alt="Blueprint"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-sm text-blue-400 hover:text-blue-300"
                >
                  החלף תוכנית
                </button>
              </div>

              {/* 3D Render or Placeholder */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">הדמיה 3D</h3>
                <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                  {render3D ? (
                    <img
                      src={render3D}
                      alt="3D Render"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6">
                      {step === "analyzing" && (
                        <>
                          <div className="animate-spin text-4xl mb-3">🔍</div>
                          <p className="text-gray-400">מנתח את התוכנית...</p>
                        </>
                      )}
                      {step === "rendering" && (
                        <>
                          <div className="animate-pulse text-4xl mb-3">🏠</div>
                          <p className="text-gray-400">יוצר הדמיה 3D...</p>
                        </>
                      )}
                      {step === "upload" && (
                        <p className="text-gray-500">ההדמיה תופיע כאן</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis results */}
        {analysis && (
          <div className="mb-8 p-6 bg-gray-900 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">ניתוח התוכנית</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analysis.rooms?.map((room: any, i: number) => (
                <div key={i} className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-white font-medium">{room.name}</p>
                  <p className="text-gray-400 text-sm">
                    {room.width}x{room.length} מ׳
                  </p>
                </div>
              ))}
            </div>
            {analysis.totalArea && (
              <p className="mt-4 text-gray-400">
                שטח כולל: <span className="text-white">{analysis.totalArea} מ״ר</span>
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Generate button */}
        {blueprintImage && !loading && step !== "done" && (
          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            צור הדמיה 3D
          </button>
        )}

        {/* Reset button */}
        {step === "done" && (
          <button
            onClick={() => {
              setBlueprintImage(null);
              setAnalysis(null);
              setRender3D(null);
              setStep("upload");
            }}
            className="w-full py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
          >
            נסה תוכנית אחרת
          </button>
        )}
      </div>
    </div>
  );
}
