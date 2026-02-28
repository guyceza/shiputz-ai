"use client";

import { useEffect, useRef, useState } from "react";

export default function RevealPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [revealSize, setRevealSize] = useState(150);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("mousemove", handleMouseMove);
      return () => container.removeEventListener("mousemove", handleMouseMove);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Full screen container */}
      <div
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden cursor-none"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* BEFORE image (base layer) */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/reveal/before.jpg')`,
          }}
        />

        {/* AFTER image (revealed through mask) */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-300"
          style={{
            backgroundImage: `url('/reveal/after.jpg')`,
            clipPath: isHovering
              ? `circle(${revealSize}px at ${mousePos.x}px ${mousePos.y}px)`
              : `circle(0px at ${mousePos.x}px ${mousePos.y}px)`,
            opacity: isHovering ? 1 : 0,
          }}
        />

        {/* Cursor ring */}
        {isHovering && (
          <div
            className="pointer-events-none absolute border-2 border-white/50 rounded-full transition-transform duration-100"
            style={{
              width: revealSize * 2,
              height: revealSize * 2,
              left: mousePos.x - revealSize,
              top: mousePos.y - revealSize,
              boxShadow: "0 0 30px rgba(255,255,255,0.3), inset 0 0 30px rgba(255,255,255,0.1)",
            }}
          />
        )}

        {/* Logo / Title */}
        <div className="absolute top-8 left-8 z-10">
          <h1 className="text-white text-4xl font-light tracking-wider" style={{ fontFamily: "Playfair Display, serif" }}>
            SHIPUTZ<span className="text-emerald-400">AI</span>
          </h1>
          <p className="text-white/60 text-sm mt-1">ראה את העתיד של הבית שלך</p>
        </div>

        {/* CTA */}
        <div className="absolute bottom-8 left-8 z-10">
          <a
            href="/visualize"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105"
          >
            <span>נסה עכשיו בחינם</span>
            <span>←</span>
          </a>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-8 right-8 z-10 text-right">
          <p className="text-white/40 text-sm">הזז את העכבר כדי לחשוף את השינוי</p>
        </div>

        {/* Labels */}
        <div 
          className="absolute top-8 right-8 z-10 transition-all duration-300"
          style={{
            color: isHovering ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)",
          }}
        >
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm">
            {isHovering ? "✨ אחרי" : "לפני"}
          </span>
        </div>

        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>
    </div>
  );
}
