"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RoomScene {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  totalPrice: string;
  items: { name: string; price: string }[];
}

const rooms: RoomScene[] = [
  {
    id: "living",
    title: "סלון",
    subtitle: "עיצוב מחדש של הסלון",
    image: "/popup-book/living-room.jpg",
    totalPrice: "₪18,500",
    items: [
      { name: "ספה", price: "₪2,500" },
      { name: "שולחן קפה", price: "₪1,200" },
      { name: "מנורה", price: "₪390" },
      { name: "תמונה", price: "₪850" },
    ],
  },
  {
    id: "kitchen",
    title: "מטבח",
    subtitle: "שיפוץ מטבח מודרני",
    image: "/popup-book/kitchen.jpg",
    totalPrice: "₪35,000",
    items: [
      { name: "ארונות", price: "₪4,200" },
      { name: "אי מטבח", price: "₪1,800" },
      { name: "תאורה", price: "₪920" },
      { name: "עציצים", price: "₪650" },
    ],
  },
  {
    id: "bedroom",
    title: "חדר שינה",
    subtitle: "חדר שינה חלומי",
    image: "/popup-book/bedroom.jpg",
    totalPrice: "₪22,000",
    items: [
      { name: "מיטה", price: "₪2,100" },
      { name: "שידה", price: "₪3,800" },
      { name: "וילון", price: "₪780" },
      { name: "שידת לילה", price: "₪950" },
    ],
  },
  {
    id: "bathroom",
    title: "חדר אמבטיה",
    subtitle: "אמבטיה מפנקת",
    image: "/popup-book/bathroom.jpg",
    totalPrice: "₪28,000",
    items: [
      { name: "אמבטיה", price: "₪5,500" },
      { name: "ארון אמבטיה", price: "₪2,800" },
      { name: "מראה", price: "₪1,400" },
      { name: "מדפים", price: "₪600" },
    ],
  },
];

export default function PopupBookScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeRoom, setActiveRoom] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Main scroll trigger for the entire section
    const mainTrigger = ScrollTrigger.create({
      trigger: container,
      start: "top 80%",
      onEnter: () => setIsVisible(true),
    });

    // Create scroll triggers for each room
    const roomTriggers = rooms.map((_, index) => {
      const roomEl = container.querySelector(`[data-room="${index}"]`);
      if (!roomEl) return null;

      return ScrollTrigger.create({
        trigger: roomEl,
        start: "top 60%",
        end: "bottom 40%",
        onEnter: () => setActiveRoom(index),
        onEnterBack: () => setActiveRoom(index),
      });
    });

    return () => {
      mainTrigger.kill();
      roomTriggers.forEach((t) => t?.kill());
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative py-16 md:py-24 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #faf8f5 0%, #f0ebe4 50%, #faf8f5 100%)",
      }}
    >
      {/* Section Header */}
      <div className="text-center mb-12 md:mb-20 px-4">
        <h2
          className={`text-3xl md:text-5xl font-bold text-gray-800 mb-4 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          📖 ספר השיפוצים שלך
        </h2>
        <p
          className={`text-lg md:text-xl text-gray-600 max-w-2xl mx-auto transition-all duration-1000 delay-200 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          גלול כדי לגלות כמה עולה לשפץ כל חדר בבית
        </p>
      </div>

      {/* Room Navigation Dots */}
      <div className="fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
        {rooms.map((room, index) => (
          <button
            key={room.id}
            onClick={() => {
              const el = containerRef.current?.querySelector(`[data-room="${index}"]`);
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className={`group flex items-center gap-2 transition-all duration-300`}
          >
            <div
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                activeRoom === index
                  ? "bg-emerald-500 scale-125 shadow-lg shadow-emerald-200"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
            <span
              className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                activeRoom === index
                  ? "opacity-100 text-emerald-600"
                  : "opacity-0 group-hover:opacity-100 text-gray-500"
              }`}
            >
              {room.title}
            </span>
          </button>
        ))}
      </div>

      {/* Rooms */}
      <div className="space-y-8 md:space-y-0">
        {rooms.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            isActive={activeRoom === index}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div
        className={`text-center mt-16 px-4 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <a
          href="/visualize"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all duration-300 hover:-translate-y-1"
        >
          🎨 רוצה לראות את הבית שלך?
          <span className="text-sm opacity-80">הדמיה חינם</span>
        </a>
      </div>
    </section>
  );
}

function RoomCard({
  room,
  index,
  isActive,
}: {
  room: RoomScene;
  index: number;
  isActive: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    const image = imageRef.current;
    if (!card || !image) return;

    const ctx = gsap.context(() => {
      // Image parallax + scale on scroll
      gsap.fromTo(
        image,
        { scale: 0.85, rotateY: index % 2 === 0 ? -8 : 8, opacity: 0 },
        {
          scale: 1,
          rotateY: 0,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 75%",
            end: "top 25%",
            scrub: 0.5,
          },
        }
      );

      // Trigger item animations
      ScrollTrigger.create({
        trigger: card,
        start: "top 60%",
        onEnter: () => setHasAnimated(true),
      });
    }, card);

    return () => ctx.revert();
  }, [index]);

  const isEven = index % 2 === 0;

  return (
    <div
      ref={cardRef}
      data-room={index}
      className="min-h-[80vh] md:min-h-screen flex items-center justify-center px-4 md:px-8"
      style={{ perspective: "1200px" }}
    >
      <div
        className={`max-w-6xl w-full flex flex-col ${
          isEven ? "md:flex-row" : "md:flex-row-reverse"
        } items-center gap-8 md:gap-16`}
      >
        {/* Image */}
        <div
          ref={imageRef}
          className="flex-1 w-full max-w-lg md:max-w-2xl"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className={`relative rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-500 ${
              isActive ? "shadow-emerald-200/50" : ""
            }`}
          >
            <Image
              src={room.image}
              alt={`ספר פופ-אפ - שיפוץ ${room.title}`}
              width={800}
              height={600}
              className="w-full h-auto"
              priority={index === 0}
            />
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            {/* Room label on image */}
            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
              <span className="text-sm font-bold text-emerald-600">{room.totalPrice}</span>
              <span className="text-xs text-gray-500 block">עלות משוערת</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 w-full max-w-md text-right">
          <div
            className={`transition-all duration-700 ${
              hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            <span className="text-emerald-500 text-sm font-semibold tracking-wide">
              {`עמוד ${index + 1} מתוך ${rooms.length}`}
            </span>
            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mt-2 mb-2">
              {room.title}
            </h3>
            <p className="text-gray-500 text-lg mb-8">{room.subtitle}</p>
          </div>

          {/* Price Items */}
          <div className="space-y-3">
            {room.items.map((item, i) => (
              <div
                key={item.name}
                className={`flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm border border-gray-100 transition-all duration-500 ${
                  hasAnimated
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-8"
                }`}
                style={{
                  transitionDelay: hasAnimated ? `${i * 120 + 300}ms` : "0ms",
                }}
              >
                <span className="text-gray-700 font-medium">{item.name}</span>
                <span className="text-emerald-600 font-bold text-lg tabular-nums">
                  {item.price}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div
            className={`mt-6 flex items-center justify-between bg-emerald-50 rounded-xl px-5 py-4 border-2 border-emerald-200 transition-all duration-700 ${
              hasAnimated
                ? "opacity-100 translate-x-0"
                : "opacity-0 translate-x-8"
            }`}
            style={{
              transitionDelay: hasAnimated ? `${rooms.length * 120 + 500}ms` : "0ms",
            }}
          >
            <span className="text-gray-700 font-bold">סה&quot;כ משוער</span>
            <span className="text-emerald-600 font-black text-xl">
              {room.totalPrice}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
