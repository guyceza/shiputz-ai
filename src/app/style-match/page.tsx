"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";


// Demo data for preview
const DEMO_RESULT = {
  style: "סקנדינבי מודרני",
  styleEnglish: "Modern Scandinavian",
  confidence: 92,
  characteristics: ["קווים נקיים", "צבעים טבעיים", "עץ בהיר", "מינימליזם חם", "תאורה טבעית", "טקסטורות רכות"],
  materials: [
    { name: "עץ אלון בהיר", usage: "רצפה ורהיטים" },
    { name: "פשתן טבעי", usage: "ריפוד וכריות" },
    { name: "קרמיקה", usage: "אגרטלים ואקססוריז" },
    { name: "מתכת שחורה", usage: "מנורות ומסגרות" },
  ],
  lighting: { type: "טבעית וחמה", description: "חלונות גדולים עם תאורת LED חמה משלימה" },
  shoppingList: [
    { item: "ספה", description: "ספת בד פשתן בגוון שמנת, 3 מושבים", material: "פשתן", priceRange: "₪4,000-8,000" },
    { item: "שולחן קפה", description: "שולחן עגול עץ אלון עם רגלי מתכת", material: "עץ + מתכת", priceRange: "₪800-2,000" },
    { item: "שטיח", description: "שטיח צמר בגוון טבעי 200×300", material: "צמר", priceRange: "₪1,500-4,000" },
    { item: "מנורת רצפה", description: "מנורת קשת שחורה עם אהיל לבן", material: "מתכת", priceRange: "₪400-1,200" },
    { item: "כריות נוי", description: "סט 4 כריות בגוונים טבעיים", material: "כותנה/פשתן", priceRange: "₪200-600" },
    { item: "אגרטל", description: "אגרטל קרמיקה לבן מינימליסטי", material: "קרמיקה", priceRange: "₪100-400" },
    { item: "מדף קיר", description: "מדף עץ אלון צף 120 ס״מ", material: "עץ", priceRange: "₪200-500" },
    { item: "שמיכת טלוויזיה", description: "שמיכה ארוגה בגוון שמנת", material: "כותנה", priceRange: "₪150-400" },
  ],
  tips: [
    "הוסיפו צמחייה ירוקה — פיקוס או מונסטרה משלימים מושלם",
    "שמרו על פלטה מצומצמת: לבן, בז׳, עץ בהיר ונגיעות שחור",
    "תעדיפו רהיטים עם רגליים — יוצר תחושת מרחב",
    "השתמשו בתאורה בשכבות: תקרה + רצפה + שולחן",
  ],
};

export default function StyleMatchPage() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [showDemo, setShowDemo] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("קובץ גדול מדי — עד 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageSrc(reader.result as string); setResult(null); setError(""); setShowDemo(false); };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (!imageSrc) return;
    setLoading(true); setResult(null); setError("");
    try {
      const res = await fetch("/api/ai-tools/style-matcher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageSrc }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "שגיאה בניתוח");
    } finally {
      setLoading(false);
    }
  };

  const activeResult = result || (showDemo ? DEMO_RESULT : null);

  return (
    <div className="min-h-screen bg-[#fafafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← חזרה</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Style Matcher</h1>
            <p className="text-gray-500 text-sm mt-1">העלו תמונה של חדר שאהבתם — נזהה את הסגנון ונעזור לכם לשחזר אותו</p>
          </div>
          <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1.5 rounded-full">5 קרדיטים</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Upload section */}
        <div className="mb-8">
          {!imageSrc ? (
            <label className="block cursor-pointer group">
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-16 text-center hover:border-gray-400 transition-all group-hover:bg-gray-50">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-700 font-medium mb-1">העלו תמונה של חדר שאהבתם</p>
                <p className="text-gray-400 text-sm">מ-Pinterest, אינסטגרם, או כל מקור השראה</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" ref={fileRef} />
            </label>
          ) : (
            <div>
              <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                <img src={imageSrc} alt="uploaded" className="w-full max-h-[400px] object-contain" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <button
                    onClick={() => { setImageSrc(null); setResult(null); setShowDemo(false); }}
                    className="w-10 h-10 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 backdrop-blur-sm transition-all"
                  >
                    ✕
                  </button>
                </div>
                {loading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 border-3 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">מנתח סגנון...</p>
                    </div>
                  </div>
                )}
              </div>
              {!result && !loading && (
                <button
                  onClick={analyze}
                  className="w-full mt-4 bg-gray-900 text-white py-4 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg"
                >
                  זהה סגנון
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">{error}</div>
        )}

        {/* Results */}
        {activeResult && <StyleResults data={activeResult} isDemo={showDemo && !result} />}
      </div>
    </div>
  );
}

function StyleResults({ data, isDemo }: { data: any; isDemo: boolean }) {
  // Color map for material badges
  const materialColors = [
    "bg-amber-50 text-amber-800 border-amber-200",
    "bg-stone-50 text-stone-800 border-stone-200",
    "bg-sky-50 text-sky-800 border-sky-200",
    "bg-emerald-50 text-emerald-800 border-emerald-200",
    "bg-rose-50 text-rose-800 border-rose-200",
    "bg-violet-50 text-violet-800 border-violet-200",
  ];

  return (
    <div className="space-y-6">
      {isDemo && (
        <div className="bg-gradient-to-r from-gray-100 to-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <p className="text-gray-500 text-sm">תצוגה לדוגמה — העלו תמונה כדי לקבל ניתוח אמיתי</p>
        </div>
      )}

      {/* Style Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-1">סגנון מזוהה</p>
              <h2 className="text-3xl font-bold">{data.style}</h2>
              <p className="text-gray-400 mt-1">{data.styleEnglish}</p>
            </div>
            <div className="text-left">
              <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center">
                <span className="text-2xl font-bold">{data.confidence}%</span>
              </div>
              <p className="text-gray-400 text-xs mt-1 text-center">ביטחון</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.characteristics?.map((c: string, i: number) => (
              <span key={i} className="bg-white/10 backdrop-blur-sm text-white/90 px-3 py-1.5 rounded-full text-sm border border-white/10">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Materials + Lighting Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Materials */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">חומרים מזוהים</h3>
          <div className="grid grid-cols-2 gap-3">
            {data.materials?.map((m: any, i: number) => (
              <div key={i} className={`rounded-xl p-4 border ${materialColors[i % materialColors.length]}`}>
                <div className="font-semibold text-sm">{m.name}</div>
                <div className="text-xs opacity-70 mt-0.5">{m.usage}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lighting */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">תאורה</h3>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2a7 7 0 00-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 00-7-7zM9 21a1 1 0 001 1h4a1 1 0 001-1v-1H9v1z"/>
                </svg>
              </div>
              <div>
                <div className="font-semibold text-amber-900">{data.lighting?.type}</div>
              </div>
            </div>
            <p className="text-amber-800 text-sm">{data.lighting?.description}</p>
          </div>

          {/* Tips preview */}
          <div className="mt-4 space-y-2">
            {data.tips?.slice(0, 2).map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="text-gray-300 mt-0.5 flex-shrink-0">→</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shopping List — Visual Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">רשימת קניות לשחזור הסגנון</h3>
          <span className="text-sm text-gray-400">{data.shoppingList?.length} פריטים</span>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {data.shoppingList?.map((item: any, i: number) => (
            <div key={i} className="group flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-lg font-bold text-gray-300 border border-gray-100 flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 text-sm">{item.item}</span>
                  <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-100 flex-shrink-0 mr-2">
                    {item.priceRange}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                <span className="inline-block mt-1 text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.material}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      {data.tips?.length > 2 && (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">טיפים לשחזור</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {data.tips?.map((tip: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-100">
                <div className="w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-gray-700">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
