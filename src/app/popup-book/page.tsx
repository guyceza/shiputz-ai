"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

// Critical: Three.js/WebGL cannot run on the server
const PopupBook = dynamic(() => import("@/components/PopupBook"), { 
  ssr: false,
  loading: () => (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="text-gray-400 animate-pulse text-lg">📖 טוען ספר...</div>
    </div>
  )
});

export default function PopupBookPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple nav */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <span className="text-xs text-gray-400">Preview Mode</span>
        </div>
      </nav>

      {/* Spacer so you can scroll to trigger the animation */}
      <div className="h-[30vh] flex items-end justify-center pb-8">
        <p className="text-gray-400 text-sm animate-bounce">↓ גלול למטה ↓</p>
      </div>

      <PopupBook />

      {/* Bottom spacer */}
      <div className="h-[40vh]" />
    </div>
  );
}
