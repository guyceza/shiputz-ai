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
  marker?: {
    top?: number;
    left?: number;
  };
  searchQuery: string;
}

interface ShoppableImageProps {
  imageSrc: string;
  imageAlt: string;
  items: ShoppableItem[];
}

function clampPercentage(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function finitePercent(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getMarkerPosition(item: ShoppableItem) {
  const markerLeft =
    finitePercent(item.marker?.left) ??
    (finitePercent(item.position.left) ?? 50) + (finitePercent(item.position.width) ?? 0) / 2;
  const markerTop =
    finitePercent(item.marker?.top) ??
    (finitePercent(item.position.top) ?? 50) + (finitePercent(item.position.height) ?? 0) / 2;

  return {
    left: clampPercentage(markerLeft, 2, 98),
    top: clampPercentage(markerTop, 2, 98),
  };
}

export function ShoppableImage({ imageSrc, imageAlt, items }: ShoppableImageProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ShoppableItem | null>(null);

  const getShoppingUrl = (item: ShoppableItem) => {
    return `https://www.google.com/search?q=${encodeURIComponent(item.searchQuery + ' לקנות בישראל')}&tbm=shop`;
  };

  const handleItemClick = (item: ShoppableItem) => {
    setSelectedItem(current => current?.id === item.id ? null : item);
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
        {items.map((item) => {
          const marker = getMarkerPosition(item);

          return (
            <button
              type="button"
              key={item.id}
              className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group focus:outline-none"
              style={{
                top: `clamp(22px, ${marker.top}%, calc(100% - 22px))`,
                left: `clamp(22px, ${marker.left}%, calc(100% - 22px))`,
              }}
              onClick={() => handleItemClick(item)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              aria-label={`הצג את הפריט ${item.name}`}
              aria-pressed={selectedItem?.id === item.id}
            >
              {/* Hotspot Hit Area */}
              <div
                className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                  hoveredItem === item.id || selectedItem?.id === item.id
                    ? "border-white/90 bg-white/20"
                    : "border-transparent hover:border-white/60"
                }`}
              />
            
              {/* Pulse Indicator */}
              <div
                className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${
                  hoveredItem === item.id || selectedItem?.id === item.id ? "opacity-0" : "opacity-100"
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
                  <div className="w-max max-w-[240px] bg-gray-900 text-white text-sm px-3 py-2 rounded-lg shadow-xl">
                    {item.name}
                    <div className="text-xs text-emerald-400 mt-1">לחצו להצגת פריט</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              )}
            </button>
          );
        })}

        {/* Selected item card */}
        {selectedItem && (
          <div className="absolute inset-x-3 bottom-3 z-30 rounded-2xl bg-gray-950/90 p-4 text-white shadow-2xl backdrop-blur-md sm:inset-x-auto sm:left-4 sm:right-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-emerald-300 mb-1">הפריט שנבחר</p>
                <h3 className="text-base font-semibold leading-snug break-words">{selectedItem.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20"
                aria-label="סגור פריט נבחר"
              >
                ✕
              </button>
            </div>
            <a
              href={getShoppingUrl(selectedItem)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-950 transition-colors hover:bg-gray-100 sm:w-auto"
            >
              חיפוש בגוגל שופינג
            </a>
          </div>
        )}
        
        {/* Instruction Overlay */}
        <div className={`absolute left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-full text-center transition-opacity ${selectedItem ? "bottom-28 opacity-0 pointer-events-none" : "bottom-4 opacity-100"}`}>
          לחצו על נקודה כדי לראות את הפריט
        </div>
      </div>
    </div>
  );
}
