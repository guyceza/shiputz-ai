"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  
  const [status, setStatus] = useState<"loading" | "confirm" | "success" | "error">("loading");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!email) {
      setStatus("error");
      setErrorMessage("לא נמצאה כתובת מייל");
      return;
    }
    setStatus("confirm");
  }, [email]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    
    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), token }),
      });

      if (response.ok) {
        setStatus("success");
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "שגיאה בהסרה מדיוור");
        setStatus("error");
      }
    } catch (err) {
      setErrorMessage("שגיאת תקשורת");
      setStatus("error");
    }
    
    setProcessing(false);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="text-gray-500">טוען...</div>
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
            לא הצלחנו לעבד את הבקשה. נסו שוב או פנו אלינו.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
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

  // Confirm state
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
          onClick={handleUnsubscribe}
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
        <div className="text-gray-500">טוען...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
