"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase";

interface ScanResult {
  description: string;
  amount: number;
  category: string;
  vendor: string;
  date: string;
  items: { name: string; quantity: number; price: number }[];
  fullText: string;
}

export default function ReceiptScannerPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanningIndex, setScanningIndex] = useState(-1);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleFiles = (files: FileList) => {
    const remaining = 3 - images.length;
    const toAdd = Array.from(files).slice(0, remaining).filter(f => f.type.startsWith("image/"));
    toAdd.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev.slice(0, 2), e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setResults([]);
    setError(null);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setResults([]);
  };

  const scan = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);
    setResults([]);
    const allResults: ScanResult[] = [];

    try {
      for (let i = 0; i < images.length; i++) {
        setScanningIndex(i);
        const res = await fetch("/api/scan-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: images[i], userEmail }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה בסריקה");
        allResults.push(data);
      }
      setResults(allResults);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setScanningIndex(-1);
    }
  };

  const reset = () => {
    setImages([]);
    setResults([]);
    setError(null);
  };

  const totalAmount = results.reduce((sum, r) => sum + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">סריקת קבלות</h1>
          <Link href="/">
            <Image src="/logo.png" alt="ShiputzAI" width={32} height={32} />
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Not logged in */}
        {!userEmail && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">נדרשת התחברות</h2>
            <p className="text-gray-500 mb-6">התחברו כדי לסרוק קבלות</p>
            <Link href="/auth" className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
              התחברות
            </Link>
          </div>
        )}

        {/* Logged in - upload area */}
        {userEmail && results.length === 0 && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-4 text-center">צלמו או העלו עד 3 קבלות — ה-AI יזהה סכום, תאריך, ספק וקטגוריה</p>

              {/* Image grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {images.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`קבלה ${i + 1}`} className="w-full h-full object-cover" />
                      {loading && scanningIndex === i && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        </div>
                      )}
                      {loading && scanningIndex > i && (
                        <div className="absolute inset-0 bg-emerald-600/40 flex items-center justify-center">
                          <span className="text-white text-2xl">✓</span>
                        </div>
                      )}
                      {!loading && (
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 left-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Add more button */}
                  {images.length < 3 && !loading && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                      <span className="text-2xl text-gray-300">+</span>
                      <span className="text-xs text-gray-400 mt-1">הוסף קבלה</span>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state - upload area */}
              {images.length === 0 && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <div className="text-4xl mb-3">📸</div>
                  <p className="font-medium text-gray-700">צלמו או העלו קבלות</p>
                  <p className="text-sm text-gray-400 mt-1">עד 3 קבלות · JPG, PNG, HEIC</p>
                </div>
              )}

              {/* Scan button */}
              {images.length > 0 && (
                <button
                  onClick={scan}
                  disabled={loading}
                  className={`w-full py-4 rounded-full font-bold text-lg transition-all ${
                    loading
                      ? "bg-emerald-700 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      סורק קבלה {scanningIndex + 1} מתוך {images.length}...
                    </span>
                  ) : `🔍 סרוק ${images.length === 1 ? "קבלה" : `${images.length} קבלות`}`}
                </button>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            {/* Total if multiple */}
            {results.length > 1 && (
              <div className="bg-gray-900 text-white rounded-2xl p-5 text-center">
                <p className="text-sm text-gray-300 mb-1">סה״כ {results.length} קבלות</p>
                <p className="text-3xl font-bold">₪{totalAmount.toLocaleString()}</p>
              </div>
            )}

            {results.map((result, ri) => (
              <div key={ri} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {results.length > 1 ? `קבלה ${ri + 1}` : "תוצאת סריקה"}
                  </h2>
                  <span className="text-2xl font-bold text-gray-900">₪{(result.amount || 0).toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">ספק</span>
                    <span className="font-medium text-gray-900">{result.vendor || "לא זוהה"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">תאריך</span>
                    <span className="font-medium text-gray-900">{result.date || "לא זוהה"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">קטגוריה</span>
                    <span className="font-medium text-gray-900">{result.category || "לא זוהה"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">תיאור</span>
                    <span className="font-medium text-gray-900">{result.description || "—"}</span>
                  </div>
                </div>

                {/* Items breakdown */}
                {result.items && result.items.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-500 mb-2">פירוט פריטים</h3>
                    <div className="space-y-1.5">
                      {result.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}</span>
                          <span className="font-medium text-gray-900">₪{(item.price || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Actions */}
            <button
              onClick={reset}
              className="w-full py-3 rounded-full font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              סרוק קבלות נוספות
            </button>
          </div>
        )}

        {/* Info */}
        <div className="text-center pt-4">
          <p className="text-xs text-gray-400">מופעל על ידי AI · הנתונים לצרכי מעקב בלבד</p>
        </div>
      </main>
    </div>
  );
}
