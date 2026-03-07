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
  },
  {
    id: "floorplan",
    title: "תוכנית קומה",
    description: "הדמיה תלת-ממדית מתוכנית אדריכלית",
    href: "/floorplan",
    type: "image" as const,
    image: "/images/ai-vision/floorplan.jpg",
  },
  {
    id: "shop-look",
    title: "Shop the Look",
    description: "מצאו וקנו מוצרים מההדמיה ישירות מחנויות בישראל",
    href: "/shop-look",
    type: "image" as const,
    image: "/images/ai-vision/shop-look.jpg",
  },
  {
    id: "video-tour",
    title: "סיור וידאו",
    description: "סרטון AI שמדמה הליכה בדירה לפני ואחרי",
    href: "/floorplan",
    type: "gif" as const,
    gif: "/images/ai-vision/video-tour.gif",
    poster: "/images/ai-vision/floorplan.jpg",
  },
  {
    id: "boq",
    title: "כתב כמויות",
    description: "פירוט חומרים, כמויות ועלויות — אוטומטי",
    href: "/dashboard/boq",
    type: "gif" as const,
    gif: "/images/ai-vision/boq.gif",
    poster: "/images/ai-vision/visualize.jpg",
  },
  {
    id: "quote",
    title: "ניתוח הצעת מחיר",
    description: "העלו הצעה מקבלן — מה סביר ומה חסר",
    href: "/dashboard",
    type: "gif" as const,
    gif: "/images/ai-vision/quote-analysis.gif",
    poster: "/images/ai-vision/visualize.jpg",
  },
  {
    id: "receipt",
    title: "סריקת קבלות",
    description: "צלמו קבלה — סכום, תאריך וקטגוריה אוטומטית",
    href: "/dashboard",
    type: "gif" as const,
    gif: "/images/ai-vision/receipt-scanner.gif",
    poster: "/images/ai-vision/visualize.jpg",
  },
];

export default function FeaturesCarousel() {
  const [active, setActive] = useState(0);
  const [beforeAfterPhase, setBeforeAfterPhase] = useState(false);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);

  const goTo = useCallback((index: number) => {
    setActive((index + features.length) % features.length);
    setBeforeAfterPhase(false);
  }, []);

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  // Auto-advance every 5s
  useEffect(() => {
    autoPlayRef.current = setInterval(next, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [next]);

  // Before/after toggle for visualize card
  useEffect(() => {
    if (features[active].type !== "before-after") return;
    const t = setInterval(() => setBeforeAfterPhase(p => !p), 2000);
    return () => clearInterval(t);
  }, [active]);

  // Reset autoplay on manual interaction
  const interact = (fn: () => void) => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    fn();
    autoPlayRef.current = setInterval(next, 5000);
  };

  // Touch support
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) interact(() => diff > 0 ? next() : prev());
  };

  // Get position relative to active
  const getOffset = (index: number) => {
    let diff = index - active;
    if (diff > features.length / 2) diff -= features.length;
    if (diff < -features.length / 2) diff += features.length;
    return diff;
  };

  return (
    <div className="relative w-full overflow-hidden py-8" dir="rtl">
      {/* Cards container */}
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
              onClick={() => !isActive ? interact(() => goTo(i)) : undefined}
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
                    {/* Before/After label */}
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
                    {/* Show GIF only when active, static poster otherwise */}
                    {isActive ? (
                      <img
                        src={feature.gif!}
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

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Text overlay */}
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

      {/* Navigation arrows */}
      <button
        onClick={() => interact(next)}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-gray-600 hover:bg-white/30 transition-colors"
        aria-label="הבא"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <button
        onClick={() => interact(prev)}
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
            onClick={() => interact(() => goTo(i))}
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
