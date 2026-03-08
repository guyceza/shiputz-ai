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
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const scan = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, userEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "שגיאה בסריקה");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="ShiputzAI" width={32} height={32} />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">סריקת קבלות</h1>
          <div className="w-8" />
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
        {userEmail && !result && (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 mb-4 text-center">צלמו או העלו תמונה של קבלה — ה-AI יזהה סכום, תאריך, ספק וקטגוריה</p>

              {!image ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <div className="text-4xl mb-3">📸</div>
                  <p className="font-medium text-gray-700">צלמו או העלו קבלה</p>
                  <p className="text-sm text-gray-400 mt-1">JPG, PNG, HEIC</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="קבלה" className="w-full h-auto max-h-[400px] object-contain bg-gray-100" />
                    <button
                      onClick={reset}
                      className="absolute top-3 left-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg hover:bg-black/80"
                    >
                      ✕
                    </button>
                  </div>

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
                        סורק קבלה...
                      </span>
                    ) : "🔍 סרוק קבלה"}
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
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
        {result && (
          <div className="space-y-4">
            {/* Summary card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">תוצאת סריקה</h2>
                <span className="text-2xl font-bold text-gray-900">₪{result.amount.toLocaleString()}</span>
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
            </div>

            {/* Items breakdown */}
            {result.items && result.items.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">פירוט פריטים</h3>
                <div className="space-y-2">
                  {result.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700">{item.name} {item.quantity > 1 ? `×${item.quantity}` : ""}</span>
                      <span className="font-medium text-gray-900">₪{item.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="flex-1 py-3 rounded-full font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                סרוק קבלה נוספת
              </button>
            </div>
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