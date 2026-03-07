"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    id: "visualize",
    title: "עיצוב מחדש",
    description: "העלו תמונה של החדר — קבלו הדמיית AI של התוצאה",
    href: "/visualize",
    type: "before-after" as const,
    before: "/before-room.webp",
    after: "/after-room.webp",
    duration: 5000, // 2.5s before + 2.5s after
  },
  {
    id: "floorplan",
    title: "תוכנית קומה",
    description: "הדמיה תלת-ממדית מתוכנית אדריכלית",
    href: "/floorplan",
    type: "image" as const,
    image: "/images/ai-vision/floorplan.jpg",
    duration: 4000,
  },
  {
    id: "shop-look",
    title: "Shop the Look",
    description: "מצאו וקנו מוצרים מההדמיה ישירות מחנויות בישראל",
    href: "/shop-look",
    type: "image" as const,
    image: "/images/ai-vision/shop-look.jpg",
    duration: 4000,
  },
  {
    id: "video-tour",
    title: "סיור וידאו",
    description: "סרטון AI המדמה הליכה בדירה בעיצוב החדש",
    href: "/floorplan",
    type: "gif" as const,
    gif: "/images/ai-vision/video-tour.gif",
    poster: "/images/ai-vision/floorplan.jpg",
    duration: 8100,
  },
  {
    id: "boq",
    title: "כתב כמויות",
    description: "פירוט חומרים, כמויות ועלויות — אוטומטי",
    href: "/dashboard/boq",
    type: "gif" as const,
    gif: "/images/ai-vision/boq.gif",
    poster: "/images/ai-vision/visualize.jpg",
    duration: 21760,
  },
  {
    id: "quote",
    title: "ניתוח הצעת מחיר",
    description: "העלו הצעה מקבלן — מה סביר ומה חסר",
    href: "/dashboard",
    type: "gif" as const,
    gif: "/images/ai-vision/quote-analysis.gif",
    poster: "/images/ai-vision/visualize.jpg",
    duration: 11300,
  },
  {
    id: "receipt",
    title: "סריקת קבלות",
    description: "צלמו קבלה — סכום, תאריך וקטגוריה אוטומטית",
    href: "/dashboard",
    type: "gif" as const,
    gif: "/images/ai-vision/receipt-scanner.gif",
    poster: "/images/ai-vision/visualize.jpg",
    duration: 14380,
  },
  {
    id: "style-match",
    title: "Style Matcher",
    description: "זיהוי סגנון עיצוב + רשימת קניות לשחזור",
    href: "/style-match",
    type: "image" as const,
    image: "/images/ai-vision/style-match.jpg",
    duration: 4000,
  },
];

export default function FeaturesCarousel() {
  const [active, setActive] = useState(0);
  const [beforeAfterPhase, setBeforeAfterPhase] = useState(false);
  const [gifKey, setGifKey] = useState(0); // force GIF restart
  const autoTimer = useRef<NodeJS.Timeout | null>(null);
  const baTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);

  const clearTimers = useCallback(() => {
    if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null; }
    if (baTimer.current) { clearTimeout(baTimer.current); baTimer.current = null; }
  }, []);

  const goTo = useCallback((index: number) => {
    clearTimers();
    const newIndex = ((index % features.length) + features.length) % features.length;
    setActive(newIndex);
    setBeforeAfterPhase(false);
    setGifKey(k => k + 1); // force GIF reload
  }, [clearTimers]);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Schedule auto-advance based on current feature's duration
  useEffect(() => {
    const feature = features[active];
    autoTimer.current = setTimeout(next, feature.duration);
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [active, next]);

  // Before/after toggle (flip at midpoint)
  useEffect(() => {
    const feature = features[active];
    if (feature.type !== "before-after") return;
    baTimer.current = setTimeout(() => setBeforeAfterPhase(true), feature.duration / 2);
    return () => { if (baTimer.current) clearTimeout(baTimer.current); };
  }, [active]);

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  // Position relative to active (circular)
  const getOffset = (index: number) => {
    let diff = index - active;
    if (diff > features.length / 2) diff -= features.length;
    if (diff < -features.length / 2) diff += features.length;
    return diff;
  };

  return (
    <div className="relative w-full overflow-hidden py-8" dir="rtl">
      {/* Cards */}
      <div
        className="relative h-[400px] md:h-[460px] flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {features.map((feature, i) => {
          const offset = getOffset(i);
          const isActive = offset === 0;
          const isVisible = Math.abs(offset) <= 2;

          if (!isVisible) return null;

          const translateX = offset * 280;
          const scale = isActive ? 1 : 0.78;
          const zIndex = isActive ? 30 : 20 - Math.abs(offset);
          const blur = isActive ? 0 : 6;
          const opacity = isActive ? 1 : Math.abs(offset) === 1 ? 0.7 : 0.4;

          return (
            <div
              key={feature.id}
              className="absolute transition-all duration-500 ease-out cursor-pointer"
              style={{
                transform: `translateX(${translateX}px) scale(${scale})`,
                zIndex,
                filter: `blur(${blur}px)`,
                opacity,
                width: "min(420px, 85vw)",
              }}
              onClick={() => !isActive && goTo(i)}
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/3]">
                {/* Media */}
                {feature.type === "before-after" ? (
                  <>
                    <Image
                      src={feature.before!}
                      alt="לפני"
                      fill
                      className={`object-cover transition-opacity duration-1000 ${beforeAfterPhase && isActive ? "opacity-0" : "opacity-100"}`}
                    />
                    <Image
                      src={feature.after!}
                      alt="אחרי"
                      fill
                      className={`object-cover transition-opacity duration-1000 ${beforeAfterPhase && isActive ? "opacity-100" : "opacity-0"}`}
                    />
                    {isActive && (
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-500">
                          {beforeAfterPhase ? "אחרי" : "לפני"}
                        </span>
                      </div>
                    )}
                  </>
                ) : feature.type === "gif" ? (
                  <>
                    {isActive ? (
                      <img
                        key={`gif-${feature.id}-${gifKey}`}
                        src={`${feature.gif!}?v=${gifKey}`}
                        alt={feature.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={feature.poster || feature.gif!}
                        alt={feature.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </>
                ) : (
                  <Image
                    src={feature.image!}
                    alt={feature.title}
                    fill
                    className={`object-cover transition-transform duration-700 ${isActive ? "scale-105" : ""}`}
                  />
                )}

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Text */}
                <div className="absolute bottom-0 right-0 left-0 p-6">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{feature.title}</h3>
                  <p className={`text-white/70 text-sm transition-all duration-500 ${isActive ? "opacity-100 max-h-20" : "opacity-0 max-h-0"} overflow-hidden`}>
                    {feature.description}
                  </p>
                  {isActive && (
                    <Link
                      href={feature.href}
                      className="inline-block mt-3 text-sm text-white/60 hover:text-white transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      נסו עכשיו ←
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrows */}
      <button
        onClick={next}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-600 hover:bg-white/30 transition-colors"
        aria-label="הבא"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        onClick={prev}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-600 hover:bg-white/30 transition-colors"
        aria-label="הקודם"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {features.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active ? "w-8 h-2 bg-gray-900" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`פיצ'ר ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
