"use client";

import Link from "next/link";
import { ShoppableImage, ShoppableItem } from "@/components/ShoppableImage";

// Hardcoded items for the demo - analyzed from the after-room.jpg image
const demoItems: ShoppableItem[] = [
  {
    id: "plant",
    name: "פיקוס כינורי",
    position: {
      top: 30,
      left: 14,
      width: 16,
      height: 50,
    },
    searchQuery: "פיקוס כינורי עציץ לקנייה",
  },
  {
    id: "sofa",
    name: "ספה דו-מושבית בז׳",
    position: {
      top: 48,
      left: 30,
      width: 28,
      height: 35,
    },
    searchQuery: "ספה דו מושבית בז סקנדינבית מודרנית",
  },
  {
    id: "tv-console",
    name: "מזנון טלוויזיה עץ ולבן",
    position: {
      top: 60,
      left: 57,
      width: 28,
      height: 22,
    },
    searchQuery: "מזנון טלוויזיה עץ לבן סקנדינבי",
  },
  {
    id: "floor-lamp",
    name: "מנורת רצפה מודרנית",
    position: {
      top: 35,
      left: 82,
      width: 10,
      height: 45,
    },
    searchQuery: "מנורת רצפה לבנה מודרנית מינימליסטית",
  },
  {
    id: "pampas-vase",
    name: "אגרטל עם פמפס",
    position: {
      top: 45,
      left: 58,
      width: 8,
      height: 18,
    },
    searchQuery: "אגרטל קרמיקה לבן פמפס יבש",
  },
  {
    id: "flooring",
    name: "פרקט עץ אלון בהיר",
    position: {
      top: 85,
      left: 10,
      width: 80,
      height: 13,
    },
    searchQuery: "פרקט למינציה עץ אלון בהיר",
  },
  {
    id: "pillows",
    name: "כריות נוי",
    position: {
      top: 52,
      left: 37,
      width: 15,
      height: 12,
    },
    searchQuery: "כריות נוי לספה בז אפור",
  },
  {
    id: "spotlights",
    name: "ספוטים שקועים",
    position: {
      top: 2,
      left: 20,
      width: 60,
      height: 8,
    },
    searchQuery: "ספוטים שקועים LED תקרה לבן",
  },
];

export default function ShopLookPage() {
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
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-full px-4 py-2 mb-6">
            <span className="text-lg">🛒</span>
            <span className="text-sm font-medium text-blue-700">Shop the Look</span>
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
          <ShoppableImage
            imageSrc="/after-room.jpg"
            imageAlt="סלון מעוצב אחרי שיפוץ"
            items={demoItems}
          />
          
          {/* Legend */}
          <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">פריטים בתמונה:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {demoItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <div className="w-2 h-2 bg-gray-900 rounded-full" />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">איך זה עובד?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="text-2xl">👆</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">לחצו על פריט</h3>
              <p className="text-sm text-gray-500">זהו את הנקודות הלבנות על התמונה ולחצו</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="text-2xl">🏪</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">בחרו חנות</h3>
              <p className="text-sm text-gray-500">IKEA, ACE, Home Center ועוד</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <span className="text-2xl">🛍️</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">מצאו מוצרים דומים</h3>
              <p className="text-sm text-gray-500">השוואת מחירים ורכישה</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">רוצים הדמיה של החדר שלכם?</h2>
          <p className="text-gray-500 mb-8">
            העלו תמונה של החדר, תארו מה אתם רוצים לשנות, וקבלו הדמיה עם רשימת קניות
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/visualize"
              className="bg-gray-900 text-white px-8 py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
            >
              נסה עכשיו
            </Link>
            <Link
              href="/"
              className="text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-100 transition-colors border border-gray-200"
            >
              חזרה לדף הבית
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-gray-900">פרטיות</Link>
            <Link href="#" className="hover:text-gray-900">צור קשר</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
