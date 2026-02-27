"use client";

import dynamic from "next/dynamic";

const Room3DViewer = dynamic(() => import("@/components/Room3DViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="animate-spin text-4xl">🏠</div>
      <p className="text-white mr-4">טוען את הבית...</p>
    </div>
  ),
});

export default function DemoHousePage() {
  return (
    <div className="fixed inset-0 bg-black" dir="rtl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <h1 className="text-xl font-bold text-white text-center">
          🏠 סיור וירטואלי - דירה לדוגמה (6 חדרים, 95 מ״ר)
        </h1>
      </div>

      {/* 3D Viewer - 6-room house: living, kitchen, hallway, 2 bedrooms, bathroom */}
      <Room3DViewer
        modelUrl="/models/test-house.glb"
        houseWidth={9}
        houseLength={14}
      />

      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/50 backdrop-blur-sm p-4 rounded-xl">
        <div className="flex flex-wrap justify-center gap-4 text-white text-sm">
          <span>💻 <strong>מחשב:</strong> לחצו על המסך, WASD לתנועה, עכבר להסתכל, ESC לצאת</span>
          <span>📱 <strong>נייד:</strong> גררו להסתכל, שתי אצבעות להתקדם</span>
        </div>
      </div>
    </div>
  );
}
