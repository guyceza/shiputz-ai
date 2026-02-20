"use client";

import { ShoppableItem } from "./ShoppableImage";

interface SearchPanelProps {
  item: ShoppableItem | null;
  onClose: () => void;
}

interface SearchOption {
  name: string;
  icon: string;
  getUrl: (query: string) => string;
  color: string;
}

const searchOptions: SearchOption[] = [
  {
    name: "Google",
    icon: "🔍",
    getUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent(query + " לקנייה בישראל")}`,
    color: "bg-white hover:bg-gray-50 border-gray-200",
  },
  {
    name: "IKEA",
    icon: "🏠",
    getUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent("site:ikea.co.il " + query)}`,
    color: "bg-[#0058A3] hover:bg-[#004280] text-white border-[#0058A3]",
  },
  {
    name: "ACE",
    icon: "🔧",
    getUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent("site:ace.co.il " + query)}`,
    color: "bg-[#E31837] hover:bg-[#C41430] text-white border-[#E31837]",
  },
  {
    name: "Home Center",
    icon: "🛋️",
    getUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent("site:homecenter.co.il " + query)}`,
    color: "bg-[#00A650] hover:bg-[#008542] text-white border-[#00A650]",
  },
  {
    name: "עמינח",
    icon: "🛏️",
    getUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent("site:aminach.co.il " + query)}`,
    color: "bg-[#1E3A5F] hover:bg-[#152A45] text-white border-[#1E3A5F]",
  },
  {
    name: "IDdesign",
    icon: "✨",
    getUrl: (query) => `https://www.google.com/search?q=${encodeURIComponent("site:iddesign.co.il " + query)}`,
    color: "bg-gray-900 hover:bg-gray-800 text-white border-gray-900",
  },
];

export function SearchPanel({ item, onClose }: SearchPanelProps) {
  if (!item) return null;

  const handleSearch = (option: SearchOption) => {
    window.open(option.getUrl(item.searchQuery), "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out animate-slideIn">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-900">חפש פריט</h2>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Item Info */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🛒</span>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{item.name}</h3>
              <p className="text-gray-500 text-sm">בחר חנות לחיפוש הפריט</p>
            </div>
            
            {/* Search Options */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-600 mb-4">חפש ב:</p>
              
              {searchOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handleSearch(option)}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border transition-all duration-200 ${option.color}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{option.icon}</span>
                    <span className="font-medium">{option.name}</span>
                  </div>
                  <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              ))}
            </div>
            
            {/* Search Query Preview */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-2">שאילתת חיפוש:</p>
              <p className="text-sm text-gray-700 font-medium" dir="rtl">"{item.searchQuery}"</p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 text-center">
              💡 טיפ: השווה מחירים במספר חנויות לפני הקנייה
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
