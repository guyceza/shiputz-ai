"use client";

import PopupBookScroll from "@/components/PopupBookScroll";
import Link from "next/link";

export default function PopupBookPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Back button */}
      <div className="fixed top-4 right-4 z-50">
        <Link
          href="/"
          className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg text-gray-600 hover:text-gray-900 transition-colors text-sm"
        >
          → חזרה לאתר
        </Link>
      </div>

      <PopupBookScroll />
    </div>
  );
}
