"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIsGoogleUser(false);

    if (!email) {
      setError("נא להזין כתובת אימייל");
      setLoading(false);
      return;
    }

    try {
      // Check if user registered with Google
      const providerCheck = await fetch(`/api/auth/check-provider?email=${encodeURIComponent(email)}`);
      const providerData = await providerCheck.json();
      
      if (providerData.exists && providerData.provider === 'google') {
        setIsGoogleUser(true);
        setLoading(false);
        return;
      }

      if (!providerData.exists) {
        setError("לא נמצא משתמש עם אימייל זה");
        setLoading(false);
        return;
      }

      // Send password reset email via Supabase
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError("שגיאה בשליחת המייל. נסה שוב.");
        console.error(resetError);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError("שגיאה. נסה שוב.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="h-11 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">שכחתי סיסמה</h1>
          <p className="text-gray-500 text-center mb-8">נשלח לך קישור לאיפוס הסיסמה</p>

          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">המייל נשלח!</h2>
              <p className="text-gray-500 mb-6">בדוק את תיבת המייל שלך וגם את תיקיית הספאם</p>
              <Link 
                href="/login"
                className="text-gray-900 hover:underline"
              >
                חזרה להתחברות
              </Link>
            </div>
          ) : isGoogleUser ? (
            <div className="text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">נרשמת עם Google</h2>
              <p className="text-gray-500 mb-6">החשבון שלך מחובר ל-Google.<br/>התחבר דרך Google ואין צורך בסיסמה!</p>
              <Link 
                href="/login"
                className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-base hover:bg-gray-800 transition-colors"
              >
                התחבר עם Google
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="אימייל"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
                required
                dir="ltr"
              />

              {error && (
                <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-3 rounded-full text-base hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {loading ? "שולח..." : "שלח קישור לאיפוס"}
              </button>

              <p className="text-center text-gray-500 mt-4">
                <Link href="/login" className="text-gray-900 hover:underline">חזרה להתחברות</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
