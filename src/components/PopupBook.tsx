"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface PriceTag {
  name: string;
  price: string;
  x: number; // percentage from left
  y: number; // percentage from top
}

interface RoomScene {
  title: string;
  image: string;
  tags: PriceTag[];
}

const SCENES: RoomScene[] = [
  {
    title: "סלון מודרני",
    image: "/popup-book/living-room.jpg",
    tags: [
      { name: "ספה מעוצבת", price: "₪4,200", x: 30, y: 52 },
      { name: "שולחן קפה", price: "₪1,800", x: 52, y: 68 },
      { name: "מנורת רצפה", price: "₪890", x: 75, y: 38 },
      { name: "שטיח צמר", price: "₪2,100", x: 48, y: 82 },
    ]
  },
  {
    title: "מטבח חלומי",
    image: "/popup-book/kitchen.jpg",
    tags: [
      { name: "אי מטבח", price: "₪8,500", x: 45, y: 58 },
      { name: "תאורה תלויה", price: "₪1,200", x: 55, y: 22 },
      { name: "כיסאות בר", price: "₪2,400", x: 28, y: 62 },
      { name: "מדפים פתוחים", price: "₪1,600", x: 78, y: 40 },
    ]
  },
  {
    title: "חדר שינה",
    image: "/popup-book/bedroom.jpg",
    tags: [
      { name: "מיטה זוגית", price: "₪5,900", x: 48, y: 48 },
      { name: "שידות לילה", price: "₪1,400", x: 18, y: 52 },
      { name: "מנורת לילה", price: "₪650", x: 80, y: 42 },
      { name: "ארון קיר", price: "₪7,200", x: 72, y: 30 },
    ]
  }
];

export default function PopupBook() {
  const containerRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const openBookRef = useRef<HTMLDivElement>(null);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const totalRef = useRef<HTMLDivElement>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [showTags, setShowTags] = useState(false);
  const [hoveredTag, setHoveredTag] = useState<number | null>(null);

  const scene = SCENES[activeScene];
  const total = scene.tags.reduce((sum, t) => {
    return sum + parseInt(t.price.replace(/[₪,]/g, ""));
  }, 0);

  useEffect(() => {
    const container = containerRef.current;
    const cover = coverRef.current;
    const openBook = openBookRef.current;
    const tagsContainer = tagsContainerRef.current;
    const totalEl = totalRef.current;
    if (!container || !cover || !openBook || !tagsContainer || !totalEl) return;

    // Reset states
    setShowTags(false);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: "top 70%",
        end: "top 10%",
        scrub: 1,
      }
    });

    // Phase 1: Cover fades and scales down
    tl.fromTo(cover,
      { opacity: 1, scale: 1, rotateY: 0 },
      { opacity: 0, scale: 0.9, rotateY: -30, duration: 0.4, ease: "power2.in" }
    );

    // Phase 2: Open book fades in and scales up
    tl.fromTo(openBook,
      { opacity: 0, scale: 0.85, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.4, ease: "power2.out" },
      0.2
    );

    // Phase 3: Price tags appear
    tl.fromTo(tagsContainer,
      { opacity: 0 },
      { 
        opacity: 1, 
        duration: 0.3,
        onComplete: () => setShowTags(true),
        onReverseComplete: () => setShowTags(false)
      },
      0.5
    );

    // Phase 4: Total appears
    tl.fromTo(totalEl,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.2 },
      0.7
    );

    return () => {
      tl.kill();
      ScrollTrigger.getAll().forEach(t => {
        if (t.vars.trigger === container) t.kill();
      });
    };
  }, [activeScene]);

  const handleSceneChange = (index: number) => {
    setActiveScene(index);
    setShowTags(false);
    setHoveredTag(null);
  };

  return (
    <section className="py-24 px-4 overflow-hidden" dir="rtl">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <p className="text-sm text-gray-400 mb-3 tracking-wider">✦ חוויה אינטראקטיבית</p>
        <h2 className="text-4xl md:text-5xl font-semibold text-gray-900 mb-4">
          הדירה שלך, בסגנון{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-l from-amber-600 to-orange-500">
            Pop-Up
          </span>
        </h2>
        <p className="text-lg text-gray-500">
          גלול למטה וצפה בחדר נפתח מתוך הספר — עם מחירים לכל מוצר
        </p>
      </div>

      {/* Scene selector */}
      <div className="flex justify-center gap-3 mb-10">
        {SCENES.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSceneChange(i)}
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

      <div ref={containerRef} className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="relative w-full max-w-2xl mx-auto" style={{ perspective: "1200px" }}>
          
          {/* Closed Book Cover */}
          <div
            ref={coverRef}
            className="relative w-full rounded-xl overflow-hidden shadow-2xl"
            style={{ aspectRatio: "4/3" }}
          >
            <Image
              src="/popup-book/cover.jpg"
              alt="ספר Pop-Up - כריכה"
              fill
              className="object-cover"
              priority
            />
            {/* Overlay with title */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end justify-center pb-8">
              <div className="text-center">
                <p className="text-white/80 text-sm mb-1">גלול כדי לפתוח</p>
                <div className="animate-bounce text-white text-2xl">↓</div>
              </div>
            </div>
          </div>

          {/* Open Book with Scene */}
          <div
            ref={openBookRef}
            className="absolute inset-0 w-full rounded-xl overflow-hidden shadow-2xl opacity-0"
            style={{ aspectRatio: "4/3" }}
          >
            <Image
              src={scene.image}
              alt={`ספר Pop-Up - ${scene.title}`}
              fill
              className="object-cover"
              priority
            />

            {/* Interactive Price Tags Overlay */}
            <div ref={tagsContainerRef} className="absolute inset-0 opacity-0">
              {scene.tags.map((tag, i) => (
                <div
                  key={`${activeScene}-${i}`}
                  className="absolute group cursor-pointer"
                  style={{
                    left: `${tag.x}%`,
                    top: `${tag.y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: hoveredTag === i ? 30 : 10 + i,
                  }}
                  onMouseEnter={() => setHoveredTag(i)}
                  onMouseLeave={() => setHoveredTag(null)}
                >
                  {/* Pulsing dot */}
                  <div className="relative">
                    <div className="w-4 h-4 bg-white rounded-full shadow-lg border-2 border-amber-500 group-hover:scale-125 transition-transform duration-200" />
                    <div className="absolute inset-0 w-4 h-4 bg-amber-400 rounded-full animate-ping opacity-40" />
                  </div>

                  {/* Price tag popup */}
                  <div 
                    className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 transition-all duration-300 ${
                      showTags ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                    }`}
                    style={{ transitionDelay: `${i * 150}ms` }}
                  >
                    {/* Tag card */}
                    <div className={`bg-white rounded-xl shadow-xl px-4 py-2.5 whitespace-nowrap border transition-all duration-200 ${
                      hoveredTag === i 
                        ? 'border-amber-400 shadow-amber-100 scale-110' 
                        : 'border-gray-100'
                    }`}>
                      <p className="text-[11px] text-gray-500 font-medium mb-0.5">{tag.name}</p>
                      <p className="text-base font-bold text-gray-900">{tag.price}</p>
                    </div>
                    {/* Arrow */}
                    <div className="flex justify-center -mt-px">
                      <div className="w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45 -translate-y-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Total price */}
        <div ref={totalRef} className="mt-8 opacity-0">
          <div className="inline-flex items-center gap-3 bg-white rounded-full px-7 py-3.5 shadow-lg border border-gray-100">
            <span className="text-sm text-gray-500">סה&quot;כ עיצוב החדר:</span>
            <span className="text-xl font-bold text-gray-900">
              {total.toLocaleString("he-IL")} ₪
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
