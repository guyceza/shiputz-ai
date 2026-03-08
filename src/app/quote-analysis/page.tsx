"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const loadingMessages = [
  "קורא את ההצעה...",
  "משווה מחירים למדד שיפוצים...",
  "בודק סבירות לפי אזור...",
  "מחפש סעיפים חסרים...",
  "מכין סיכום...",
];

function FormattedText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className={`whitespace-pre-wrap ${className}`} dir="rtl">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </div>
  );
}

export default function QuoteAnalysisPage() {
  const [quoteText, setQuoteText] = useState("");
  const [quoteImage, setQuoteImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQuoteImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!quoteText.trim() && !quoteImage) return;
    setAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setVerdict(null);
    setLoadingMsg(0);

    const msgInterval = setInterval(() => {
      setLoadingMsg((prev) => Math.min(prev + 1, loadingMessages.length - 1));
    }, 2500);

    try {
      if (quoteImage) {
        // Image-based analysis
        const fd = new FormData();
        const blob = await fetch(quoteImage).then(r => r.blob());
        fd.append("image", blob, "quote.jpg");
        const res = await fetch("/api/analyze-quote", { method: "POST", body: fd });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAnalysis(data.analysis || data.result);
        setVerdict(data.verdict || null);
      } else {
        // Text-based analysis
        const res = await fetch("/api/analyze-quote-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: quoteText }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setAnalysis(data.analysis || data.result);
        setVerdict(data.verdict || null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בניתוח ההצעה");
    } finally {
      setAnalyzing(false);
      clearInterval(msgInterval);
    }
  };

  const reset = () => {
    setQuoteText("");
    setQuoteImage(null);
    setAnalysis(null);
    setVerdict(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Header */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ShiputzAI" width={24} height={24} />
            <span className="text-sm font-medium text-gray-900">ShiputzAI</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            חזרה לדשבורד
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">ניתוח הצעת מחיר</h1>
          <p className="text-gray-500 text-lg">העלו הצעה מקבלן או כתבו את הפרטים — נבדוק אם המחיר סביר</p>
        </div>

        {/* Input State */}
        {!analysis && !analyzing && !error && (
          <div className="space-y-6">
            {/* Image Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                quoteImage ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              {quoteImage ? (
                <div className="space-y-3">
                  <img src={quoteImage} alt="הצעת מחיר" className="max-h-64 mx-auto rounded-xl" />
                  <p className="text-sm text-gray-500">לחץ להחלפת תמונה</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-900 font-medium">העלו תמונה של הצעת המחיר</p>
                  <p className="text-sm text-gray-400">צילום מהטלפון, PDF או סקריינשוט</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-400">או כתבו ידנית</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Text Input */}
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder={"לדוגמה:\nצביעת דירת 4 חדרים - 8,000 ש״ח\nהחלפת ברז במטבח - 450 ש״ח\nהתקנת מזגן כולל נקודה - 2,500 ש״ח"}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 h-40 resize-none text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              dir="rtl"
            />

            {/* Submit */}
            <button
              onClick={handleAnalyze}
              disabled={!quoteText.trim() && !quoteImage}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-medium text-lg hover:bg-gray-800 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              נתח הצעה
            </button>
          </div>
        )}

        {/* Loading */}
        {analyzing && (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-6" />
            <p className="text-gray-900 font-medium text-lg mb-2">{loadingMessages[loadingMsg]}</p>
            <p className="text-gray-400 text-sm">זה לוקח כ-15 שניות</p>
          </div>
        )}

        {/* Error */}
        {error && !analyzing && (
          <div className="py-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-5">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-gray-900 font-medium text-lg mb-2">לא הצלחנו לנתח את ההצעה</p>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button
              onClick={reset}
              className="bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800"
            >
              נסה שוב
            </button>
          </div>
        )}

        {/* Results */}
        {analysis && !analyzing && !error && (
          <div className="space-y-6">
            {/* Verdict */}
            {verdict && (
              <div className={`p-6 rounded-2xl text-center ${
                verdict === "great" ? "bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200" :
                verdict === "ok" ? "bg-gradient-to-br from-blue-50 to-sky-50 border border-blue-200" :
                verdict === "expensive" ? "bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200" :
                "bg-gradient-to-br from-red-50 to-rose-50 border border-red-200"
              }`}>
                <div className={`text-3xl font-bold mb-1 ${
                  verdict === "great" ? "text-green-600" :
                  verdict === "ok" ? "text-blue-600" :
                  verdict === "expensive" ? "text-orange-600" :
                  "text-red-600"
                }`}>
                  {verdict === "great" && "🎉 מציאה!"}
                  {verdict === "ok" && "👍 מחיר סביר"}
                  {verdict === "expensive" && "⚠️ יקר"}
                  {verdict === "very_expensive" && "🚨 יקר מדי!"}
                </div>
              </div>
            )}

            {/* Analysis */}
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">סיכום הניתוח</h3>
              <FormattedText text={analysis} className="text-gray-700 leading-relaxed" />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 bg-gray-900 text-white py-3.5 rounded-full font-medium hover:bg-gray-800 transition-all"
              >
                נתח הצעה נוספת
              </button>
              <Link
                href="/dashboard"
                className="flex-1 bg-gray-100 text-gray-900 py-3.5 rounded-full font-medium hover:bg-gray-200 transition-all text-center"
              >
                חזרה לדשבורד
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
