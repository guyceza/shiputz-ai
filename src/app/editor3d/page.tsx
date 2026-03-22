"use client";

import { useState } from "react";
import Link from "next/link";

export default function Editor3DPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0a0a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-gray-800 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-gray-400 hover:text-white text-sm transition"
          >
            ← חזרה לאתר
          </Link>
          <span className="text-gray-600">|</span>
          <h1 className="text-white font-semibold text-sm">
            🏗️ עורך תלת-ממדי
          </h1>
        </div>
        <div className="text-gray-500 text-xs">
          מבוסס Pascal Editor • קוד פתוח
        </div>
      </div>

      {/* Loading */}
      {!loaded && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
            <p className="text-gray-400">טוען עורך תלת-ממדי...</p>
          </div>
        </div>
      )}

      {/* Pascal Editor iframe */}
      <iframe
        src="https://editor.pascal.app"
        className={`flex-1 w-full border-0 ${loaded ? "" : "hidden"}`}
        onLoad={() => setLoaded(true)}
        allow="clipboard-read; clipboard-write"
        title="3D Building Editor"
      />
    </div>
  );
}
