"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface PopupItem {
  name: string;
  price: string;
  x: number; // percentage from left
  y: number; // percentage from top
  delay: number;
  icon: string;
}

const ROOM_SCENES = [
  {
    title: "סלון מודרני",
    color: "#E8DDD3",
    accentColor: "#8B7355",
    items: [
      { name: "ספה מעוצבת", price: "₪4,200", x: 25, y: 55, delay: 0, icon: "🛋️" },
      { name: "שולחן קפה", price: "₪1,800", x: 50, y: 70, delay: 0.1, icon: "☕" },
      { name: "מנורת רצפה", price: "₪890", x: 78, y: 40, delay: 0.2, icon: "💡" },
      { name: "שטיח צמר", price: "₪2,100", x: 45, y: 85, delay: 0.15, icon: "🏠" },
      { name: "כרית נוי", price: "₪180", x: 18, y: 48, delay: 0.25, icon: "✨" },
    ]
  },
  {
    title: "מטבח חלומי",
    color: "#D4E4D9",
    accentColor: "#4A7C5C",
    items: [
      { name: "אי מטבח", price: "₪8,500", x: 40, y: 60, delay: 0, icon: "🍳" },
      { name: "תאורה תלויה", price: "₪1,200", x: 55, y: 25, delay: 0.1, icon: "💡" },
      { name: "ברז מעוצב", price: "₪950", x: 70, y: 50, delay: 0.2, icon: "🚿" },
      { name: "כיסאות בר", price: "₪2,400", x: 25, y: 65, delay: 0.15, icon: "🪑" },
      { name: "מדפים פתוחים", price: "₪1,600", x: 80, y: 35, delay: 0.25, icon: "📚" },
    ]
  },
  {
    title: "חדר שינה",
    color: "#DDD4E4",
    accentColor: "#6B4F7C",
    items: [
      { name: "מיטה זוגית", price: "₪5,900", x: 45, y: 50, delay: 0, icon: "🛏️" },
      { name: "שידות לילה", price: "₪1,400", x: 15, y: 55, delay: 0.1, icon: "🪑" },
      { name: "מנורת לילה", price: "₪650", x: 80, y: 45, delay: 0.2, icon: "💡" },
      { name: "ארון קיר", price: "₪7,200", x: 75, y: 35, delay: 0.15, icon: "🚪" },
      { name: "וילונות", price: "₪1,100", x: 30, y: 30, delay: 0.25, icon: "🪟" },
    ]
  }
];

export default function PopupBook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [activeScene, setActiveScene] = useState(0);
  const [isBookOpen, setIsBookOpen] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const book = bookRef.current;
    const cover = coverRef.current;
    if (!container || !book || !cover) return;

    // Main timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1.5,
        onUpdate: (self) => {
          if (self.progress > 0.15) {
            setIsBookOpen(true);
          } else {
            setIsBookOpen(false);
          }
        }
      }
    });

    // Phase 1: Book slides in and cover opens
    tl.fromTo(book, 
      { y: 60, opacity: 0, rotateX: 10 },
      { y: 0, opacity: 1, rotateX: 0, duration: 0.2, ease: "power2.out" }
    );

    tl.to(cover, {
      rotateY: -175,
      duration: 0.35,
      ease: "power3.inOut",
    }, 0.1);

    // Phase 2: Pop-up items rise
    const scene = ROOM_SCENES[activeScene];
    scene.items.forEach((item, i) => {
      const el = itemsRef.current[i];
      if (!el) return;

      tl.fromTo(el,
        { 
          y: 40, 
          opacity: 0, 
          scale: 0.3,
          rotateX: -45
        },
        { 
          y: 0, 
          opacity: 1, 
          scale: 1,
          rotateX: 0,
          duration: 0.15,
          ease: "back.out(1.7)"
        },
        0.35 + item.delay
      );
    });

    // Phase 3: Subtle float animation for items after they appear
    tl.to({}, { duration: 0.3 }); // hold

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === container) t.kill();
      });
    };
  }, [activeScene]);

  const scene = ROOM_SCENES[activeScene];

  return (
    <section className="py-32 px-6 overflow-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <p className="text-sm text-gray-400 mb-3 tracking-wider">✦ חוויה אינטראקטיבית</p>
        <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
          הדירה שלך, בסגנון <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-600 to-orange-500">Pop-Up</span>
        </h2>
        <p className="text-lg text-gray-500">
          גלול למטה וצפה בחדר נפתח מתוך הספר — עם מחירים לכל מוצר
        </p>
      </div>

      {/* Scene selector */}
      <div className="flex justify-center gap-3 mb-12">
        {ROOM_SCENES.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveScene(i)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeScene === i
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/25"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div ref={containerRef} className="min-h-[80vh] flex items-center justify-center">
        {/* The Book */}
        <div
          ref={bookRef}
          className="relative w-full max-w-2xl mx-auto"
          style={{ perspective: "1200px", transformStyle: "preserve-3d" }}
        >
          {/* Book Shadow */}
          <div 
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] h-8 rounded-[50%] transition-all duration-700"
            style={{
              background: "radial-gradient(ellipse, rgba(0,0,0,0.15) 0%, transparent 70%)",
              filter: "blur(4px)",
              opacity: isBookOpen ? 1 : 0.5,
              transform: `translateX(-50%) scaleX(${isBookOpen ? 1.1 : 0.8})`
            }}
          />

          {/* Book Base / Spine */}
          <div className="relative" style={{ transformStyle: "preserve-3d" }}>
            
            {/* Back Page (right page - visible content) */}
            <div
              className="relative w-full rounded-lg overflow-hidden"
              style={{
                aspectRatio: "4/3",
                background: `linear-gradient(135deg, ${scene.color} 0%, #FAFAF8 50%, ${scene.color}33 100%)`,
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.05), 0 4px 20px rgba(0,0,0,0.1)",
                transformStyle: "preserve-3d",
              }}
            >
              {/* Paper texture overlay */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                  backgroundSize: "100px 100px"
                }}
              />

              {/* Fold line (center crease) */}
              <div 
                className="absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2"
                style={{
                  background: "linear-gradient(to bottom, transparent, rgba(0,0,0,0.08), rgba(0,0,0,0.12), rgba(0,0,0,0.08), transparent)",
                }}
              />
              <div 
                className="absolute top-0 bottom-0 left-1/2 w-4 -translate-x-1/2"
                style={{
                  background: "linear-gradient(to right, rgba(0,0,0,0.02), transparent, rgba(0,0,0,0.02))",
                }}
              />

              {/* Room title on page */}
              <div className="absolute top-4 right-6 z-10">
                <span 
                  className="text-xs font-medium tracking-wider uppercase opacity-40"
                  style={{ color: scene.accentColor }}
                >
                  {scene.title}
                </span>
              </div>

              {/* Pop-up Items */}
              {scene.items.map((item, i) => (
                <div
                  key={`${activeScene}-${i}`}
                  ref={(el) => { itemsRef.current[i] = el; }}
                  className="absolute group cursor-pointer"
                  style={{
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: "translate(-50%, -50%)",
                    transformStyle: "preserve-3d",
                    zIndex: 10 + i,
                  }}
                >
                  {/* Paper fold base (triangle shadow) */}
                  <div 
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-2 opacity-20"
                    style={{
                      background: "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)",
                    }}
                  />

                  {/* The pop-up element */}
                  <div 
                    className="relative transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Item icon */}
                    <div 
                      className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-2xl shadow-md border-2 border-white/80"
                      style={{ 
                        background: `linear-gradient(145deg, white 0%, ${scene.color} 100%)`,
                        boxShadow: `0 4px 12px ${scene.accentColor}20, 0 1px 3px rgba(0,0,0,0.1)`,
                      }}
                    >
                      {item.icon}
                    </div>

                    {/* Price tag - hanging from string */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                      {/* String */}
                      <div 
                        className="w-px h-3"
                        style={{ background: `linear-gradient(to bottom, ${scene.accentColor}60, ${scene.accentColor})` }}
                      />
                      {/* Tag */}
                      <div 
                        className="relative px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
                        style={{
                          background: "white",
                          border: `1.5px solid ${scene.accentColor}30`,
                          boxShadow: `0 2px 8px ${scene.accentColor}15, 0 1px 2px rgba(0,0,0,0.05)`,
                        }}
                      >
                        {/* Tag hole */}
                        <div 
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border"
                          style={{ 
                            borderColor: `${scene.accentColor}40`,
                            background: scene.color 
                          }}
                        />
                        <span 
                          className="text-xs font-bold block text-center"
                          style={{ color: scene.accentColor }}
                        >
                          {item.price}
                        </span>
                      </div>
                    </div>

                    {/* Item name tooltip on hover */}
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div 
                        className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg"
                        style={{ 
                          background: scene.accentColor,
                          color: "white"
                        }}
                      >
                        {item.name}
                        <div 
                          className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
                          style={{ background: scene.accentColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Decorative fold marks */}
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l border-gray-300/30 rounded-bl-sm" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r border-gray-300/30 rounded-br-sm" />
              <div className="absolute top-3 left-3 w-6 h-6 border-t border-l border-gray-300/30 rounded-tl-sm" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t border-r border-gray-300/30 rounded-tr-sm" />
            </div>

            {/* Front Cover (flips open) */}
            <div
              ref={coverRef}
              className="absolute inset-0 rounded-lg overflow-hidden"
              style={{
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                zIndex: 20,
              }}
            >
              {/* Front of cover */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                style={{
                  background: `linear-gradient(145deg, ${scene.accentColor} 0%, ${scene.accentColor}DD 50%, ${scene.accentColor}BB 100%)`,
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.15)",
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Embossed title */}
                <div className="text-center" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
                  <div className="text-5xl mb-4 opacity-80">📖</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white/90 mb-2">
                    ShiputzAI
                  </h3>
                  <div className="w-16 h-px bg-white/30 mx-auto mb-3" />
                  <p className="text-sm text-white/60 font-medium">
                    {scene.title}
                  </p>
                </div>

                {/* Book texture lines */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 h-px bg-white"
                      style={{ top: `${(i + 1) * 7.5}%` }}
                    />
                  ))}
                </div>

                {/* Spine edge highlight */}
                <div 
                  className="absolute top-0 bottom-0 left-0 w-3"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.15), transparent)",
                  }}
                />
              </div>

              {/* Back of cover (visible when flipped) */}
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: `linear-gradient(135deg, ${scene.color} 0%, #F5F0EB 100%)`,
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                  boxShadow: "inset 0 0 30px rgba(0,0,0,0.03)",
                }}
              >
                {/* Paper texture on inside cover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="text-8xl">🏠</div>
                </div>
              </div>
            </div>

            {/* Book spine (left edge) */}
            <div 
              className="absolute top-0 bottom-0 -left-2 w-4 rounded-l-sm"
              style={{
                background: `linear-gradient(to right, ${scene.accentColor}99, ${scene.accentColor}CC)`,
                boxShadow: "-2px 0 8px rgba(0,0,0,0.1)",
                zIndex: 25,
              }}
            />

            {/* Page edges (visible from side) */}
            <div 
              className="absolute top-1 bottom-1 -right-1 w-2"
              style={{
                background: "repeating-linear-gradient(to bottom, #F5F0EB 0px, #F5F0EB 2px, #E8E4DF 2px, #E8E4DF 3px)",
                borderRadius: "0 2px 2px 0",
              }}
            />
          </div>

          {/* Total price summary */}
          <div 
            className={`mt-8 text-center transition-all duration-700 ${isBookOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          >
            <div className="inline-flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-lg border border-gray-100">
              <span className="text-sm text-gray-500">סה&quot;כ עיצוב החדר:</span>
              <span className="text-lg font-bold" style={{ color: scene.accentColor }}>
                {scene.items.reduce((sum, item) => {
                  const price = parseInt(item.price.replace(/[₪,]/g, ""));
                  return sum + price;
                }, 0).toLocaleString("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
