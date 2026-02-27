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

// Room data from the blueprint analysis - with proper door connections
const ROOMS = [
  { id: "living", name: "סלון ושינה", type: "living", width: 6.45, length: 5, position: { x: 0, y: 1.3 } },
  { id: "bathroom", name: "חדר רחצה", type: "bathroom", width: 2.45, length: 1.3, position: { x: 0, y: 0 } },
  { id: "utility", name: "שירות", type: "storage", width: 1.4, length: 1.5, position: { x: 2.45, y: 0 } },
  { id: "stairs", name: "מדרגות", type: "hallway", width: 2.6, length: 2.5, position: { x: 3.85, y: 0 } },
  { id: "balcony", name: "מרפסת", type: "balcony", width: 1.2, length: 2.5, position: { x: -1.2, y: 2.3 } },
];

export default function GuyApartmentPage() {
  return (
    <div className="fixed inset-0 bg-black" dir="rtl">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm p-4">
        <h1 className="text-xl font-bold text-white text-center">
          🏠 סיור וירטואלי - דירת סטודיו (40 מ״ר)
        </h1>
        <p className="text-gray-300 text-center text-sm mt-1">
          נוצר אוטומטית מתוכנית אדריכלית
        </p>
      </div>

      {/* 3D Viewer */}
      <Room3DViewer
        modelUrl="/demo-apartment.glb"
        rooms={ROOMS}
        houseWidth={7.65}
        houseLength={6.3}
      />

      {/* Controls hint - bottom left */}
      <div className="absolute bottom-4 left-4 z-10 bg-black/50 backdrop-blur-sm p-3 rounded-xl max-w-xs">
        <div className="text-white text-xs space-y-1">
          <p>💻 <strong>מחשב:</strong> WASD לתנועה, גרירה להסתכל</p>
          <p>📱 <strong>נייד:</strong> חצים לתנועה, גרירה להסתכל</p>
          <p>📋 <strong>ניווט:</strong> לחצו על חדר ברשימה לקפוץ אליו</p>
        </div>
      </div>
    </div>
  );
}
