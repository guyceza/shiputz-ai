"use client";

import { useState } from "react";

export interface ShoppableItem {
  id: string;
  name: string;
  position: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  searchQuery: string;
}

interface ShoppableImageProps {
  imageSrc: string;
  imageAlt: string;
  items: ShoppableItem[];
}

export function ShoppableImage({ imageSrc, imageAlt, items }: ShoppableImageProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Go directly to Google Shopping
  const handleItemClick = (item: ShoppableItem) => {
    const googleShoppingUrl = `https://www.google.com/search?q=${encodeURIComponent(item.searchQuery + ' לקנות בישראל')}&tbm=shop`;
    window.open(googleShoppingUrl, "_blank");
  };

  return (
    <div className="relative w-full">
      {/* Image Container */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Main Image */}
        <img
          src={imageSrc}
          alt={imageAlt}
          className="w-full h-auto"
        />
        
        {/* Hotspots */}
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute cursor-pointer transition-all duration-300 group"
            style={{
              top: `${item.position.top}%`,
              left: `${item.position.left}%`,
              width: `${item.position.width}%`,
              height: `${item.position.height}%`,
            }}
            onClick={() => handleItemClick(item)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {/* Hotspot Border */}
            <div
              className={`absolute inset-0 border-2 rounded-lg transition-all duration-300 ${
                hoveredItem === item.id
                  ? "border-white/80 bg-white/10"
                  : "border-transparent hover:border-white/50"
              }`}
            />
            
            {/* Pulse Indicator */}
            <div
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
                hoveredItem === item.id ? "opacity-0" : "opacity-100"
              }`}
            >
              <div className="relative">
                <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                </div>
                <div className="absolute inset-0 w-6 h-6 bg-white rounded-full animate-ping opacity-50" />
              </div>
            </div>
            
            {/* Tooltip */}
            {hoveredItem === item.id && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-20 pointer-events-none">
                <div className="bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
                  {item.name}
                  <div className="text-xs text-emerald-400 mt-1">לחץ לחיפוש ב-Google Shopping</div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Instruction Overlay */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full">
          לחצו על פריט לחיפוש ב-Google Shopping
        </div>
      </div>
    </div>
  );
}
