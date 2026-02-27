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

type ViewMode = "image" | "walkthrough";
type Step = "upload" | "analyzing" | "generating" | "done";

export default function BlueprintTo3DPage() {
  const [blueprintImage, setBlueprintImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [render3D, setRender3D] = useState<string | null>(null);
  const [gltfData, setGltfData] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("walkthrough");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setBlueprintImage(e.target?.result as string);
      setAnalysis(null);
      setRender3D(null);
      setGltfData(null);
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
    setProgress("מנתח את התוכנית האדריכלית...");

    try {
      // Step 1: Analyze blueprint with Gemini
      const analyzeRes = await fetch("/api/lab/analyze-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: blueprintImage }),
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error || "שגיאה בניתוח התוכנית");
      }

      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData);
      setStep("generating");
      
      if (viewMode === "walkthrough") {
        setProgress("בונה מודל תלת-ממדי לסיור...");
        
        // Generate GLTF for walkthrough
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
      } else {
        setProgress("יוצר הדמיה...");
        
        // Generate static image
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
      }
      
      setStep("done");
    } catch (err: any) {
      setError(err.message || "שגיאה לא צפויה");
      setStep("upload");
    } finally {
      setLoading(false);
      setProgress("");
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

  const largestRoom = analysis?.rooms?.[0] || { width: 4, length: 5 };
  
  // Calculate house bounds from all rooms
  const houseBounds = analysis?.rooms?.reduce((bounds: any, room: any) => {
    const pos = room.position || { x: 0, y: 0 };
    const maxX = pos.x + room.width;
    const maxY = pos.y + room.length;
    return {
      width: Math.max(bounds.width, maxX),
      length: Math.max(bounds.length, maxY),
    };
  }, { width: 0, length: 0 }) || { width: largestRoom.width, length: largestRoom.length };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">תוכנית → סיור וירטואלי 3D</h1>
        <p className="text-gray-400 mb-6">
          העלו תוכנית אדריכלית וטיילו בתוך הבית בתלת-ממד
        </p>

        {/* Mode selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setViewMode("walkthrough")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "walkthrough"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🚶 סיור אינטראקטיבי
          </button>
          <button
            onClick={() => setViewMode("image")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === "image"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            🖼️ תמונה סטטית
          </button>
        </div>

        {/* Upload area */}
        <div className="mb-6">
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
              className="w-full h-48 border-2 border-dashed border-gray-700 rounded-xl hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center gap-4"
            >
              <span className="text-5xl">📐</span>
              <span className="text-gray-400">לחצו להעלאת תוכנית אדריכלית</span>
            </button>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Blueprint thumbnail */}
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

              {/* 3D View */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  {viewMode === "walkthrough" ? "סיור וירטואלי" : "הדמיה 3D"}
                </h3>
                <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
                  {step === "done" && viewMode === "walkthrough" && gltfData ? (
                    <Room3DViewer
                      modelUrl={gltfData}
                      roomWidth={largestRoom.width}
                      roomLength={largestRoom.length}
                      houseWidth={houseBounds.width}
                      houseLength={houseBounds.length}
                    />
                  ) : step === "done" && viewMode === "image" && render3D ? (
                    <img
                      src={render3D}
                      alt="3D Render"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
                      {loading ? (
                        <>
                          <div className="animate-spin text-4xl mb-3">
                            {step === "analyzing" ? "🔍" : "🏠"}
                          </div>
                          <p className="text-gray-400">{progress}</p>
                        </>
                      ) : (
                        <p className="text-gray-500">
                          {viewMode === "walkthrough"
                            ? "הסיור הוירטואלי יופיע כאן"
                            : "ההדמיה תופיע כאן"}
                        </p>
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
          <div className="mb-6 p-6 bg-gray-900 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-4">ניתוח התוכנית</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analysis.rooms?.map((room: any, i: number) => (
                <div key={i} className="p-4 bg-gray-800 rounded-lg">
                  <p className="text-white font-medium">{room.name}</p>
                  <p className="text-gray-400 text-sm">
                    {room.width}x{room.length} מ׳
                  </p>
                  {room.features?.length > 0 && (
                    <p className="text-gray-500 text-xs mt-1">
                      {room.features.join(", ")}
                    </p>
                  )}
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
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Generate button */}
        {blueprintImage && !loading && step !== "done" && (
          <button
            onClick={handleGenerate}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            {viewMode === "walkthrough" ? "🚶 צור סיור וירטואלי" : "🖼️ צור הדמיה"}
          </button>
        )}

        {/* Reset button */}
        {step === "done" && (
          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep("upload");
                setRender3D(null);
                if (gltfData) {
                  URL.revokeObjectURL(gltfData);
                  setGltfData(null);
                }
              }}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
            >
              {viewMode === "walkthrough" ? "🔄 צור מחדש" : "🔄 צור הדמיה חדשה"}
            </button>
            <button
              onClick={() => {
                setBlueprintImage(null);
                setAnalysis(null);
                setRender3D(null);
                if (gltfData) {
                  URL.revokeObjectURL(gltfData);
                  setGltfData(null);
                }
                setStep("upload");
              }}
              className="flex-1 py-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
            >
              📐 תוכנית אחרת
            </button>
          </div>
        )}

        {/* Tips */}
        {step === "done" && viewMode === "walkthrough" && (
          <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
            <h4 className="text-white font-medium mb-2">💡 טיפים לסיור</h4>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• <strong>במחשב:</strong> לחצו על המסך, WASD לתנועה, עכבר להסתכל</li>
              <li>• <strong>בנייד:</strong> גררו להסתכל, שתי אצבעות להתקדם</li>
              <li>• <strong>ESC</strong> לצאת ממצב הסיור</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
