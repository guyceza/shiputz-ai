"use client";

import React from "react";

export default function VisualizeV2Preview() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style>{`
        @keyframes slide-reveal {
          0% { clip-path: inset(0 100% 0 0); }
          50% { clip-path: inset(0 0 0 0); }
          100% { clip-path: inset(0 100% 0 0); }
        }
        @keyframes pulse-arrow {
          0%, 100% { opacity: 0.4; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(-4px); }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-slide-reveal {
          animation: slide-reveal 6s ease-in-out infinite;
        }
        .animate-pulse-arrow {
          animation: pulse-arrow 1.5s ease-in-out infinite;
        }
        .animate-float-badge {
          animation: float-badge 3s ease-in-out infinite;
        }
      `}</style>

      {/* Minimal Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">ShiputzAI</span>
          <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">דף תצוגה מקדימה</span>
        </div>
      </nav>

      {/* Hero Section - V2 */}
      <section className="pt-20 pb-12 px-4">
        <div className="max-w-lg mx-auto text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center bg-gray-100 px-4 py-2 rounded-full mb-5">
            <span className="text-sm font-medium text-gray-700">חדש! ראה איך השיפוץ שלך יראה</span>
          </div>
          
          {/* Headline */}
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-5 text-gray-900">
            ראה את השיפוץ<br />
            <span className="text-gray-900">לפני שמתחיל.</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg text-gray-500 max-w-md mx-auto mb-6 leading-relaxed">
            העלו תמונה של החדר, תארו מה רוצים לשנות, וה-AI ייצור לכם תמונה של התוצאה.
          </p>
          
          {/* Features */}
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> תמונה תוך שניות
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> הערכת עלויות
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> מחירי שוק
            </span>
          </div>

          {/* ======= NEW: Before/After with Phone Mockup ======= */}
          
          {/* Before → After Label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-lg font-bold text-gray-400">לפני</span>
            <div className="flex items-center gap-1">
              <span className="animate-pulse-arrow text-2xl text-emerald-500">←</span>
            </div>
            <span className="text-lg font-bold text-emerald-600">אחרי ✨</span>
          </div>

          {/* Phone Mockup with Before/After */}
          <div className="relative mx-auto" style={{ maxWidth: '320px' }}>
            {/* Phone Frame */}
            <div className="relative rounded-[2.5rem] border-[6px] border-gray-900 bg-gray-900 shadow-2xl overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-900 rounded-b-2xl z-20" />
              
              {/* Screen Content */}
              <div className="relative bg-white rounded-[2rem] overflow-hidden">
                {/* Before Image */}
                <div className="relative aspect-[9/16]">
                  <img 
                    src="/before-room.jpg" 
                    alt="לפני השיפוץ"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* After Image Overlay with animation */}
                  <div 
                    className="absolute inset-0 animate-slide-reveal"
                  >
                    <img 
                      src="/after-room.jpg" 
                      alt="אחרי השיפוץ"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Labels on image */}
                  <div className="absolute top-8 right-3 z-10">
                    <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      📷 לפני
                    </span>
                  </div>
                  <div className="absolute top-8 left-3 z-10">
                    <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-float-badge">
                      ✨ אחרי
                    </span>
                  </div>

                  {/* Divider line */}
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/60 z-10 shadow-lg" />
                </div>
              </div>
            </div>
            
            {/* Reflection/Shadow */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-gray-900/10 rounded-full blur-xl" />
          </div>

          {/* Cost estimate badge */}
          <div className="mt-8 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-5 py-3 rounded-2xl">
            <span className="text-2xl">💰</span>
            <div className="text-right">
              <div className="text-xs text-gray-400">עלות משוערת</div>
              <div className="text-lg font-bold text-gray-900">₪15,550</div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              className="bg-gray-900 text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              🎨 צור הדמיה
            </button>
            <span className="text-xs text-gray-400">הניסיון הראשון חינם • לא צריך כרטיס אשראי</span>
          </div>

        </div>
      </section>

      {/* Comparison: OLD vs NEW */}
      <section className="py-12 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">השוואה: ישן ← חדש</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Old Version */}
            <div className="bg-white rounded-2xl p-6 border border-red-200">
              <div className="text-center mb-3">
                <span className="text-sm font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full">❌ גרסה ישנה</span>
              </div>
              <p className="text-sm text-gray-500 text-center mb-4">Laptop mockup — קטן וקשה לקריאה על מובייל</p>
              <div className="rounded-xl overflow-hidden shadow border border-gray-200">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full"
                  poster="/demo-video-poster.jpg"
                >
                  <source src="/demo-video.mp4" type="video/mp4" />
                </video>
              </div>
            </div>

            {/* New Version */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-200">
              <div className="text-center mb-3">
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">✅ גרסה חדשה</span>
              </div>
              <p className="text-sm text-gray-500 text-center mb-4">Phone mockup + אנימציית before/after — ברור מיד</p>
              <div className="flex justify-center">
                <div className="relative" style={{ maxWidth: '200px' }}>
                  <div className="relative rounded-[1.8rem] border-[4px] border-gray-900 bg-gray-900 shadow-xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-gray-900 rounded-b-xl z-20" />
                    <div className="relative bg-white rounded-[1.5rem] overflow-hidden">
                      <div className="relative aspect-[9/16]">
                        <img src="/before-room.jpg" alt="לפני" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 animate-slide-reveal">
                          <img src="/after-room.jpg" alt="אחרי" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute top-4 right-2 z-10">
                          <span className="bg-white/90 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full">📷 לפני</span>
                        </div>
                        <div className="absolute top-4 left-2 z-10">
                          <span className="bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full">✨ אחרי</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative: Full-width Before/After (no phone frame) */}
      <section className="py-12 px-4 border-t border-gray-100">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3 text-gray-900">אופציה 2: בלי מסגרת טלפון</h2>
          <p className="text-sm text-gray-500 mb-6">Full-width before/after — אולי אפילו יותר ברור</p>
          
          {/* Before → After Label */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-lg font-bold text-gray-400">לפני</span>
            <span className="animate-pulse-arrow text-2xl text-emerald-500">←</span>
            <span className="text-lg font-bold text-emerald-600">אחרי ✨</span>
          </div>

          {/* Full Width Before/After */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="relative aspect-[4/3]">
              <img 
                src="/before-room.jpg" 
                alt="לפני"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 animate-slide-reveal">
                <img 
                  src="/after-room.jpg" 
                  alt="אחרי"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Labels */}
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                  📷 לפני
                </span>
              </div>
              <div className="absolute top-4 left-4 z-10">
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg animate-float-badge">
                  ✨ אחרי
                </span>
              </div>
              
              {/* Center divider */}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 z-10" />
            </div>
          </div>

          {/* Cost badge */}
          <div className="mt-6 inline-flex items-center gap-2 bg-gray-50 border border-gray-200 px-5 py-3 rounded-2xl">
            <span className="text-2xl">💰</span>
            <div className="text-right">
              <div className="text-xs text-gray-400">עלות משוערת</div>
              <div className="text-lg font-bold text-gray-900">₪15,550</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <div className="py-8 px-4 text-center border-t border-gray-100">
        <p className="text-sm text-gray-400">
          🔬 דף תצוגה מקדימה — לא מופיע בניווט הראשי
        </p>
      </div>
    </div>
  );
}
