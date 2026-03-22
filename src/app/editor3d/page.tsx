"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";

const PascalEditor = dynamic(
  () => import("@pascal-app/editor").then((mod) => ({ default: mod.Editor })),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">טוען עורך תלת-ממדי...</p>
        </div>
      </div>
    ),
  }
);

type SceneGraph = { nodes: Record<string, unknown>; rootNodeIds: string[] };

export default function Editor3DPage() {
  const [scene, setScene] = useState<SceneGraph | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/floorplan/to-pascal", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setScene(data.sceneGraph);
      setShowUpload(false);
    } catch (err) {
      alert("שגיאה בניתוח התוכנית. נסה שוב.");
    } finally {
      setUploading(false);
    }
  }, []);

  const onLoad = useCallback(async (): Promise<SceneGraph | null> => {
    return scene;
  }, [scene]);

  if (showUpload) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="max-w-lg w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">🏗️ עורך תלת-ממדי</h1>
            <p className="text-gray-400">העלה תוכנית דירה ← AI ינתח ← מודל 3D מוכן לעריכה</p>
          </div>

          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
              ${uploading ? "border-emerald-500 bg-emerald-500/10" : "border-gray-600 hover:border-emerald-500 hover:bg-gray-900"}`}
            onClick={() => !uploading && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleUpload(file);
            }}
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
                <p className="text-emerald-400 font-medium">מנתח תוכנית... (10-20 שניות)</p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">📐</div>
                <p className="text-white font-medium text-lg mb-2">גרור תוכנית לכאן</p>
                <p className="text-gray-500 text-sm">או לחץ לבחירת קובץ</p>
              </>
            )}
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />

          <button
            className="w-full mt-4 py-3 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition"
            onClick={() => { setScene(null); setShowUpload(false); }}
          >
            או התחל מאפס בלי תוכנית →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen relative">
      <PascalEditor onLoad={onLoad} />
      
      {/* Floating upload button */}
      <button
        className="absolute top-4 left-4 z-50 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition flex items-center gap-2"
        onClick={() => { setShowUpload(true); }}
      >
        📐 העלה תוכנית
      </button>
    </div>
  );
}
