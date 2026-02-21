"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ShoppableImage, ShoppableItem } from "@/components/ShoppableImage";

// Fun loading messages
const loadingMessages = [
  "מזהה מוצרים בתמונה...",
  "אתם יכולים להביא קפה בינתיים ☕",
  "סורקים כל פינה בחדר...",
  "מחפשים את הספה המושלמת...",
  "הבינה המלאכותית עובדת בשבילכם 🤖",
  "עוד רגע מסיימים...",
  "בודקים אם יש מבצעים...",
  "סופרים כריות על הספה...",
  "מודדים את המזנון...",
  "כמעט שם! 🎯",
];

// Default demo items for fallback
const demoItems: ShoppableItem[] = [
  { id: "plant", name: "פיקוס כינורי", position: { top: 30, left: 14, width: 16, height: 50 }, searchQuery: "פיקוס כינורי עציץ לקנייה" },
  { id: "sofa", name: "ספה דו-מושבית בז׳", position: { top: 48, left: 30, width: 28, height: 35 }, searchQuery: "ספה דו מושבית בז סקנדינבית מודרנית" },
  { id: "tv-console", name: "מזנון טלוויזיה עץ ולבן", position: { top: 60, left: 57, width: 28, height: 22 }, searchQuery: "מזנון טלוויזיה עץ לבן סקנדינבי" },
  { id: "floor-lamp", name: "מנורת רצפה מודרנית", position: { top: 35, left: 82, width: 10, height: 45 }, searchQuery: "מנורת רצפה לבנה מודרנית מינימליסטית" },
  { id: "pampas-vase", name: "אגרטל עם פמפס", position: { top: 45, left: 58, width: 8, height: 18 }, searchQuery: "אגרטל קרמיקה לבן פמפס יבש" },
  { id: "flooring", name: "פרקט עץ אלון בהיר", position: { top: 85, left: 10, width: 80, height: 13 }, searchQuery: "פרקט למינציה עץ אלון בהיר" },
  { id: "pillows", name: "כריות נוי", position: { top: 52, left: 37, width: 15, height: 12 }, searchQuery: "כריות נוי לספה בז אפור" },
  { id: "spotlights", name: "ספוטים שקועים", position: { top: 2, left: 20, width: 60, height: 8 }, searchQuery: "ספוטים שקועים LED תקרה לבן" },
];

export default function ShopLookPage() {
  const [imageSrc, setImageSrc] = useState<string>("/after-room.jpg");
  const [items, setItems] = useState<ShoppableItem[]>(demoItems);
  const [loading, setLoading] = useState(false);
  const [isCustomImage, setIsCustomImage] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [messageIndex, setMessageIndex] = useState(0);

  // Countdown and message rotation during loading
  useEffect(() => {
    if (loading) {
      setCountdown(30);
      setMessageIndex(0);
      
      const countdownInterval = setInterval(() => {
        setCountdown(prev => Math.max(0, prev - 1));
      }, 1000);
      
      const messageInterval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
      
      return () => {
        clearInterval(countdownInterval);
        clearInterval(messageInterval);
      };
    }
  }, [loading]);

  useEffect(() => {
    // Check for custom image from localStorage
    const customImage = localStorage.getItem('shopLookImage');
    if (customImage) {
      setImageSrc(customImage);
      setIsCustomImage(true);
      setLoading(true);
      
      // Analyze image with AI to detect products
      analyzeImage(customImage);
      
      // Clear from localStorage after reading
      localStorage.removeItem('shopLookImage');
    }
  }, []);

  const analyzeImage = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/detect-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
      }
    } catch (error) {
      console.error('Product detection failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-30 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-500 hover:text-gray-900">
              מאמרים וטיפים
            </Link>
            <Link href="/login" className="text-xs text-gray-900 hover:text-gray-600">
              התחברות
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 mb-6">
            <img src="/icons/cart.png" alt="" className="w-5 h-5" />
            <span className="text-sm font-medium text-gray-900">Shop the Look</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4 text-gray-900">
            קנה את הסגנון
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            לחצו על כל פריט בתמונה כדי למצוא היכן לקנות אותו בישראל
          </p>
        </div>
      </section>

      {/* Interactive Image */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 aspect-video flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-lg text-gray-800 font-medium mb-2">{loadingMessages[messageIndex]}</p>
                {countdown > 0 ? (
                  <p className="text-gray-500">עוד {countdown} שניות...</p>
                ) : (
                  <p className="text-orange-600">לוקח קצת יותר זמן, עוד רגע...</p>
                )}
              </div>
            </div>
          ) : (
            <ShoppableImage
              imageSrc={imageSrc}
              imageAlt="סלון מעוצב אחרי שיפוץ"
              items={items}
            />
          )}
          
          {/* Legend */}
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <h3 className="font-semibold text-gray-900 mb-4">פריטים בתמונה</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  {item.name}
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-2xl">
              <span className="text-3xl mb-3 block">🔍</span>
              <h4 className="font-semibold text-gray-900 mb-2">זיהוי אוטומטי</h4>
              <p className="text-sm text-gray-600">AI מזהה כל מוצר בתמונה</p>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-2xl">
              <span className="text-3xl mb-3 block">🇮🇱</span>
              <h4 className="font-semibold text-gray-900 mb-2">חיפוש בישראל</h4>
              <p className="text-sm text-gray-600">מציאת מוצרים דומים בחנויות ישראליות</p>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-2xl">
              <span className="text-3xl mb-3 block">💰</span>
              <h4 className="font-semibold text-gray-900 mb-2">השוואת מחירים</h4>
              <p className="text-sm text-gray-600">מצאו את המחיר הטוב ביותר</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-5xl mx-auto text-center text-sm text-gray-500">
          <p>חלק מ-ShiputzAI - ניהול שיפוצים חכם</p>
        </div>
      </footer>
    </div>
  );
}
