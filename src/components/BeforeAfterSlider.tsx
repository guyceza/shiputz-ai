"use client";

import { useState, useRef } from "react";

interface BeforeAfterSliderProps {
  beforeImg: string;
  afterImg: string;
  className?: string;
  compact?: boolean;
}

export default function BeforeAfterSlider({ beforeImg, afterImg, className = "", compact = false }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-gray-100 select-none touch-none ${className}`}
      onMouseMove={(e) => { if (isDragging) handleMove(e.clientX); }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onTouchMove={(e) => { if (isDragging) handleMove(e.touches[0].clientX); }}
      onTouchEnd={() => setIsDragging(false)}
    >
      {/* After image (LEFT side) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={afterImg} alt="אחרי" className="w-full h-full object-cover" />
        <div className={`absolute top-2 left-2 bg-gray-900 text-white px-2 py-0.5 rounded ${compact ? "text-[10px]" : "text-xs"}`}>
          אחרי
        </div>
      </div>

      {/* Before image (RIGHT side) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <img src={beforeImg} alt="לפני" className="w-full h-full object-cover" />
        <div className={`absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded ${compact ? "text-[10px]" : "text-xs"}`}>
          לפני
        </div>
      </div>

      {/* Slider handle */}
      <div
        className="absolute top-0 bottom-0 w-6 cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: "translateX(-50%)" }}
        onMouseDown={() => setIsDragging(true)}
        onTouchStart={() => setIsDragging(true)}
      >
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white shadow-lg -translate-x-1/2" />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg flex items-center justify-center ${compact ? "w-7 h-7" : "w-10 h-10"}`}>
          <span className={`text-gray-400 ${compact ? "text-xs" : ""}`}>↔</span>
        </div>
      </div>
    </div>
  );
}
