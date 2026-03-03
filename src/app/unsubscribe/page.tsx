"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  
  const [email, setEmail] = useState(emailFromUrl);
  const [manualEmail, setManualEmail] = useState("");
  const [status, setStatus] = useState<"loading" | "confirm" | "manual" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const doUnsubscribe = useCallback(async (targetEmail?: string) => {
    const emailToUse = targetEmail || email;
    if (!emailToUse) return;
    
    setProcessing(true);
    
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse.toLowerCase(), token }),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data.error || "שגיאה בהסרה מדיוור");
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("שגיאת תקשורת — נסו שוב מאוחר יותר");
      setStatus("error");
    }
    
    setProcessing(false);
  }, [email, token]);

  useEffect(() => {
    if (!emailFromUrl) {
      // No email in URL — show manual input form
      setStatus("manual");
      return;
    }
    
    // If token is present, auto-unsubscribe (one-click from email)
    if (token) {
      doUnsubscribe();
    } else {
      // No token — show confirm screen (manual or old links)
      setStatus("confirm");
    }
  }, [emailFromUrl, token, doUnsubscribe]);

  if (status === "loading" || (processing && status !== "error")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl">📧</span>
          </div>
          <p className="text-gray-500">מסיר מרשימת הדיוור...</p>
        </div>
      </div>
    );
  }

  if (status === "manual") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6" dir="rtl">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">הסרה מדיוור</h1>
          <p className="text-gray-500 mb-6">
            הזינו את כתובת המייל שלכם כדי להסיר מרשימת התפוצה
          </p>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (manualEmail.trim()) {
              setEmail(manualEmail.trim());
              doUnsubscribe(manualEmail.trim());
            }
          }}>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
              placeholder="your@email.com"
              required
              dir="ltr"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 text-center mb-4"
            />
            <button
              type="submit"
              disabled={processing || !manualEmail.trim()}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 mb-4"
            >
              {processing ? "מעבד..." : "הסירו אותי מהרשימה"}
            </button>
          </form>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6" dir="rtl">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">שגיאה</h1>
          <p className="text-gray-500 mb-6">
            {errorMessage || "לא הצלחנו לעבד את הבקשה. נסו שוב או פנו אלינו."}
          </p>
          {email && (
            <button
              onClick={doUnsubscribe}
              disabled={processing}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 mb-4"
            >
              {processing ? "מעבד..." : "נסו שוב"}
            </button>
          )}
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6" dir="rtl">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✓</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">הוסרת מהדיוור</h1>
          <p className="text-gray-500 mb-6">
            לא תקבלו יותר מיילים שיווקיים מ-ShiputzAI.
            <br />
            <span className="text-sm">(מיילים חשובים על החשבון שלכם עדיין ישלחו)</span>
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            חזרה לאתר
          </Link>
        </div>
      </div>
    );
  }

  // Confirm state (only shown for links without token)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6" dir="rtl">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">📧</span>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">הסרה מדיוור</h1>
        <p className="text-gray-500 mb-2">
          האם להסיר את הכתובת הבאה מרשימת התפוצה?
        </p>
        <p className="text-gray-900 font-medium mb-6" dir="ltr">
          {email}
        </p>
        
        <button
          onClick={doUnsubscribe}
          disabled={processing}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 mb-4"
        >
          {processing ? "מעבד..." : "כן, הסירו אותי"}
        </button>
        
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          ביטול
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <span className="text-3xl">📧</span>
          </div>
          <p className="text-gray-500">טוען...</p>
        </div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
