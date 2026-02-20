"use client";

import { useState } from "react";
import Link from "next/link";

interface ExampleCard {
  id: number;
  title: string;
  beforeDesc: string;
  afterDesc: string;
  changes: string;
  costs: { item: string; price: number }[];
  total: number;
}

const EXAMPLES: ExampleCard[] = [
  {
    id: 1,
    title: "סלון מודרני",
    beforeDesc: "סלון ישן עם קירות לבנים ורצפת שיש",
    afterDesc: "סלון מעוצב עם פרקט, תאורה שקועה ופינת ישיבה מודרנית",
    changes: "החלפת ריצוף לפרקט, התקנת 8 ספוטים שקועים, צביעה בגוון אפור-כחלחל",
    costs: [
      { item: "פרקט עץ אלון (25 מ״ר)", price: 6250 },
      { item: "תאורה שקועה (8 ספוטים)", price: 2400 },
      { item: "צביעה (60 מ״ר)", price: 2400 },
      { item: "עבודה", price: 4500 },
    ],
    total: 15550,
  },
  {
    id: 2,
    title: "מטבח כפרי",
    beforeDesc: "מטבח ישן עם ארונות לבנים וחיפוי קרמיקה",
    afterDesc: "מטבח כפרי עם ארונות עץ, משטח שיש וחיפוי אריחים מעוצבים",
    changes: "החלפת חזיתות לעץ אלון, משטח שיש קיסר, חיפוי קרמיקה מרוקאית",
    costs: [
      { item: "חזיתות עץ אלון (4 מטר)", price: 8000 },
      { item: "משטח שיש קיסר", price: 4500 },
      { item: "חיפוי קרמיקה (3 מ״ר)", price: 1800 },
      { item: "עבודה והתקנה", price: 3500 },
    ],
    total: 17800,
  },
  {
    id: 3,
    title: "חדר שינה מינימליסטי",
    beforeDesc: "חדר שינה עם ארון ישן וצבע צהבהב",
    afterDesc: "חדר שינה מינימליסטי עם ארון קיר מלא, גבס דקורטיבי ותאורה עקיפה",
    changes: "ארון קיר מלא 3 מטר, תקרת גבס עם תאורה עקיפה, צביעה לבנה",
    costs: [
      { item: "ארון קיר (3 מטר)", price: 7500 },
      { item: "תקרת גבס (15 מ״ר)", price: 2700 },
      { item: "תאורה עקיפה LED", price: 1200 },
      { item: "צביעה (45 מ״ר)", price: 1800 },
      { item: "עבודה", price: 3200 },
    ],
    total: 16400,
  },
];

function BeforeAfterSlider({ beforeDesc, afterDesc }: { beforeDesc: string; afterDesc: string }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Before side */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center p-6"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🏠</span>
          </div>
          <p className="text-amber-800 font-medium text-sm">לפני</p>
          <p className="text-amber-700 text-xs mt-1 max-w-[200px]">{beforeDesc}</p>
        </div>
      </div>
      
      {/* After side */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center p-6"
        style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">✨</span>
          </div>
          <p className="text-emerald-800 font-medium text-sm">אחרי</p>
          <p className="text-emerald-700 text-xs mt-1 max-w-[200px]">{afterDesc}</p>
        </div>
      </div>
      
      {/* Slider handle */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-gray-400">↔</span>
        </div>
      </div>
      
      {/* Slider input */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
      />
    </div>
  );
}

function ExampleCardComponent({ example }: { example: ExampleCard }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300">
      <BeforeAfterSlider beforeDesc={example.beforeDesc} afterDesc={example.afterDesc} />
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{example.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{example.changes}</p>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          {showDetails ? "הסתר פירוט עלויות ↑" : "הצג פירוט עלויות ↓"}
        </button>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
            <div className="space-y-2">
              {example.costs.map((cost, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cost.item}</span>
                  <span className="text-gray-900">₪{cost.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 font-semibold">
              <span className="text-gray-900">סה״כ משוער</span>
              <span className="text-gray-900">₪{example.total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisualizePage() {
  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
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

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full mb-6">
            <span className="text-lg">✨</span>
            <span className="text-sm font-medium text-purple-700">חדש! ראה איך השיפוץ שלך יראה</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-gray-900">
            ראה את השיפוץ<br />
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">לפני שמתחיל.</span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            העלה תמונה של החדר, תאר מה אתה רוצה לשנות, וה-AI ייצור לך תמונה של התוצאה הסופית עם הערכת עלויות מדויקת.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> תמונה תוך שניות
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> הערכת עלויות מדויקת
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> מבוסס מחירי שוק
            </span>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              ראה איך זה עובד
            </h2>
            <p className="text-gray-500">דוגמאות אמיתיות של חדרים שעברו הדמיה</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {EXAMPLES.map((example) => (
              <ExampleCardComponent key={example.id} example={example} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              איך זה עובד?
            </h2>
          </div>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-purple-600">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">צלם את החדר</h3>
                <p className="text-gray-500">העלה תמונה של החדר שאתה רוצה לשפץ. עובד עם כל חדר - סלון, מטבח, חדר שינה, חדר רחצה.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-blue-600">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">תאר את השינויים</h3>
                <p className="text-gray-500">&quot;רוצה פרקט במקום אריחים, תאורה שקועה, וצבע אפור-כחול&quot; - פשוט ככה.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-emerald-600">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">קבל הדמיה + עלויות</h3>
                <p className="text-gray-500">תוך שניות תקבל תמונה של התוצאה הסופית, עם פירוט מדויק של העלויות הצפויות.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              רוצה לנסות בעצמך?
            </h2>
            <p className="text-gray-500">הירשם לשירות ההדמיה</p>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
            {/* Premium badge */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              Premium
            </div>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-4">
                <span className="text-4xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">איך השיפוץ שלי יראה?</h3>
              <p className="text-sm text-gray-500">תוסף לחשבון ShiputzAI קיים</p>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-900">₪39.99</div>
              <p className="text-gray-500">לחודש</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">10 הדמיות ביום</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">הערכת עלויות AI מדויקת</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">שמירת היסטוריית הדמיות</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">השוואה לפני/אחרי</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="text-gray-700">שיתוף עם קבלנים</span>
              </li>
            </ul>
            
            <Link
              href="/signup?plan=vision"
              className="block w-full text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-full text-base font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              התחל עכשיו
            </Link>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              דורש חשבון ShiputzAI פעיל · ביטול בכל עת
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              שאלות נפוצות
            </h2>
          </div>
          
          <div className="space-y-6">
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה מדויקת הערכת העלויות?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                ההערכות מבוססות על מחירי שוק מעודכנים ומדויקות ל-±15%. המערכת לוקחת בחשבון את סוג העבודה, חומרים, ואזור גיאוגרפי.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה הדמיות אפשר ליצור?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                עם מנוי לשירות ההדמיה אפשר ליצור עד 10 הדמיות ביום. המכסה מתאפסת בחצות.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                איך משתפים את ההדמיה עם קבלן?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                כל הדמיה נשמרת אוטומטית בפרויקט שלך. אפשר לשתף באמצעות לינק ישיר או להוריד כ-PDF עם כל פירוט העלויות.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                האם זה עובד עם כל סוג של חדר?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                כן! המערכת עובדת עם כל סוג חדר - סלון, מטבח, חדר שינה, חדר רחצה, מרפסת, ועוד. מומלץ לצלם תמונה ברורה עם תאורה טובה.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">
            מוכן לראות את השיפוץ שלך?
          </h2>
          <p className="text-gray-400 mb-8">
            הצטרף לאלפי משפצים שכבר משתמשים בשירות ההדמיה
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/signup?plan=vision"
              className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
            >
              התחל עכשיו
            </Link>
            <Link
              href="/login"
              className="text-white px-8 py-4 rounded-full text-base border border-gray-700 hover:bg-gray-800 transition-colors"
            >
              יש לי כבר חשבון
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
            <Link href="/" className="hover:text-gray-900">דף הבית</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
