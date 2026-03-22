"use client";

import { useState, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
import type { FloorplanData } from "@/components/floorplan/FloorplanViewer";

// Dynamic import for Three.js (SSR not supported)
const FloorplanViewer = dynamic(
  () => import("@/components/floorplan/FloorplanViewer"),
  { ssr: false, loading: () => <ViewerSkeleton /> }
);

function ViewerSkeleton() {
  return (
    <div className="w-full h-full min-h-[400px] rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
      <div className="text-gray-400 animate-pulse">טוען תצוגה תלת-ממדית...</div>
    </div>
  );
}

export default function FloorplanPage() {
  const [floorplan, setFloorplan] = useState<FloorplanData | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [visualizing, setVisualizing] = useState(false);
  const [vizResult, setVizResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setFloorplan(null);
    setVizResult(null);
    setSelectedRoom(null);

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const resp = await fetch("/api/floorplan/analyze", {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const data = await resp.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data = await resp.json();
      setFloorplan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בניתוח התוכנית");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleVisualizeRoom = useCallback(async () => {
    if (!selectedRoom || !floorplan) return;
    setVisualizing(true);
    setVizResult(null);

    try {
      // Take screenshot
      const takeScreenshot = (window as unknown as Record<string, () => string>).__takeFloorplanScreenshot;
      if (!takeScreenshot) throw new Error("Screenshot not available");
      const dataUrl = takeScreenshot();

      // Find room info
      const room = floorplan.rooms.find((r) => r.name === selectedRoom);
      const roomType = room?.type || "room";

      // Send to visualize API
      const resp = await fetch("/api/visualize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          prompt: `עצב מחדש את ה${roomType === "bedroom" ? "חדר שינה" : roomType === "bathroom" ? "חדר אמבטיה" : roomType === "kitchen" ? "מטבח" : roomType === "living" ? "סלון" : "חדר"} "${selectedRoom}" בסגנון מודרני ומינימליסטי. הוסף ריהוט מתאים, תאורה, וחומרי גמר איכותיים.`,
        }),
      });

      if (!resp.ok) throw new Error("Visualization failed");
      const data = await resp.json();
      if (data.image) setVizResult(data.image);
    } catch (err) {
      setError("שגיאה בהדמיית החדר");
    } finally {
      setVisualizing(false);
    }
  }, [selectedRoom, floorplan]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100" dir="rtl">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📐 תוכנית לתלת-ממד</h1>
            <p className="text-gray-400 text-sm mt-1">
              העלה תוכנית דירה וקבל מודל תלת-ממדי אינטראקטיבי
            </p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
          >
            ← חזרה
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Upload Area - Show when no floorplan */}
        {!floorplan && !loading && (
          <div
            className="border-2 border-dashed border-gray-700 rounded-2xl p-12 text-center hover:border-emerald-500/50 transition cursor-pointer"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-xl font-semibold mb-2">העלה תוכנית דירה</h2>
            <p className="text-gray-400 mb-4">
              גרור תמונה לכאן או לחץ לבחירה
            </p>
            <p className="text-gray-500 text-sm">
              תומך ב-JPG, PNG, PDF • תוכניות מקצועיות, סקיצות, או צילומים
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-2">מנתח את התוכנית...</h2>
            <p className="text-gray-400">
              ה-AI מזהה קירות, חדרים, דלתות וחלונות
            </p>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="תוכנית"
                className="max-w-sm mx-auto mt-6 rounded-lg opacity-50"
              />
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setFloorplan(null);
                setPreviewUrl(null);
              }}
              className="mt-3 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-lg text-sm transition"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* Main Content - Show when floorplan loaded */}
        {floorplan && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Upload new */}
              <button
                onClick={() => {
                  setFloorplan(null);
                  setPreviewUrl(null);
                  setVizResult(null);
                  setSelectedRoom(null);
                }}
                className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition"
              >
                📤 העלה תוכנית חדשה
              </button>

              {/* Stats */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="font-semibold mb-3 text-gray-300">📊 סיכום</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{floorplan.walls.length}</div>
                    <div className="text-gray-400 text-xs">קירות</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{floorplan.rooms.length}</div>
                    <div className="text-gray-400 text-xs">חדרים</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{floorplan.doors?.length || 0}</div>
                    <div className="text-gray-400 text-xs">דלתות</div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold">{floorplan.windows?.length || 0}</div>
                    <div className="text-gray-400 text-xs">חלונות</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 text-center">
                  {floorplan.dimensions.width}m × {floorplan.dimensions.height}m
                </div>
              </div>

              {/* Rooms list */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                <h3 className="font-semibold mb-3 text-gray-300">🏠 חדרים</h3>
                <div className="space-y-2">
                  {floorplan.rooms.map((room, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setSelectedRoom(
                          selectedRoom === room.name ? null : room.name
                        )
                      }
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition flex items-center gap-2 ${
                        selectedRoom === room.name
                          ? "bg-emerald-700 text-white"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                        style={{
                          backgroundColor:
                            selectedRoom === room.name
                              ? "#ffd700"
                              : (
                                  {
                                    bedroom: "#8b9dc3",
                                    bathroom: "#7ec8e3",
                                    kitchen: "#f4a460",
                                    living: "#98d98e",
                                    hallway: "#d3d3d3",
                                    balcony: "#c5e1a5",
                                    storage: "#bcaaa4",
                                    laundry: "#b0bec5",
                                    entrance: "#ffe082",
                                  } as Record<string, string>
                                )[room.type] || "#e0e0e0",
                        }}
                      />
                      <span className="truncate">{room.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visualize button */}
              {selectedRoom && (
                <button
                  onClick={handleVisualizeRoom}
                  disabled={visualizing}
                  className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 rounded-xl font-semibold transition text-sm"
                >
                  {visualizing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> מדמיין...
                    </span>
                  ) : (
                    `🎨 הדמה את "${selectedRoom}"`
                  )}
                </button>
              )}

              {/* Original image */}
              {previewUrl && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="font-semibold mb-2 text-gray-300 text-sm">
                    📋 תוכנית מקורית
                  </h3>
                  <img
                    src={previewUrl}
                    alt="תוכנית"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* 3D Viewer */}
            <div className="lg:col-span-3 space-y-4">
              <div className="h-[500px] lg:h-[600px]">
                <FloorplanViewer
                  data={floorplan}
                  selectedRoom={selectedRoom}
                  onSelectRoom={setSelectedRoom}
                  onScreenshot={(url) => console.log("Screenshot taken")}
                />
              </div>

              {/* Visualization result */}
              {vizResult && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <h3 className="font-semibold mb-3 text-gray-300">
                    🎨 הדמיית &quot;{selectedRoom}&quot;
                  </h3>
                  <img
                    src={vizResult}
                    alt="הדמיה"
                    className="w-full rounded-xl"
                  />
                </div>
              )}

              {/* Instructions */}
              <div className="text-center text-gray-500 text-xs">
                💡 גלגל עכבר לזום • גרור לסיבוב • לחץ על חדר לבחירה • Shift+גרור להזזה
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
