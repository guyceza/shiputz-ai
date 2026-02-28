"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function RevealPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 }); // percentage
  const [isHovering, setIsHovering] = useState(false);
  const [smoothPos, setSmoothPos] = useState({ x: 50, y: 50 });

  // Smooth follow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSmoothPos(prev => ({
        x: prev.x + (mousePos.x - prev.x) * 0.15,
        y: prev.y + (mousePos.y - prev.y) * 0.15,
      }));
    }, 16);
    return () => clearInterval(interval);
  }, [mousePos]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-8" dir="rtl">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl font-light text-white tracking-wide">
            SHIPUTZ<span className="text-emerald-400 font-medium">AI</span>
          </h1>
        </Link>
        <p className="text-gray-400 mt-2 text-lg">הזז את העכבר כדי לראות את השינוי</p>
      </div>

      {/* Main reveal container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-5xl aspect-[16/10] rounded-2xl overflow-hidden shadow-2xl cursor-none"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          boxShadow: "0 25px 80px -20px rgba(0,0,0,0.5), 0 0 60px -15px rgba(16, 185, 129, 0.2)",
        }}
      >
        {/* BEFORE image (base layer) */}
        <img
          src="/examples/living-before.jpg"
          alt="לפני"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />

        {/* AFTER image with mask */}
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            opacity: isHovering ? 1 : 0,
            maskImage: `radial-gradient(circle at ${smoothPos.x}% ${smoothPos.y}%, black 0%, black 15%, transparent 35%)`,
            WebkitMaskImage: `radial-gradient(circle at ${smoothPos.x}% ${smoothPos.y}%, black 0%, black 15%, transparent 35%)`,
          }}
        >
          <img
            src="/examples/living-after.jpg"
            alt="אחרי"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Glow effect following cursor */}
        {isHovering && (
          <div
            className="absolute pointer-events-none transition-all duration-100"
            style={{
              left: `${smoothPos.x}%`,
              top: `${smoothPos.y}%`,
              transform: "translate(-50%, -50%)",
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />
        )}

        {/* Labels */}
        <div className="absolute top-4 right-4 z-10">
          <span 
            className="text-sm font-medium px-4 py-2 rounded-full backdrop-blur-md transition-all duration-300"
            style={{
              background: isHovering ? "rgba(16, 185, 129, 0.3)" : "rgba(0,0,0,0.4)",
              color: "white",
            }}
          >
            {isHovering ? "✨ אחרי" : "📷 לפני"}
          </span>
        </div>

        {/* Subtle vignette */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)",
          }}
        />
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Link
          href="/visualize"
          className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-full font-medium text-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/30"
        >
          <span>צור הדמיה לחדר שלך</span>
          <span className="text-xl">←</span>
        </Link>
        <p className="text-gray-500 mt-4 text-sm">חינם לנסיון • ללא כרטיס אשראי</p>
      </div>
    </div>
  );
}
