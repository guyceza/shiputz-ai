"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Handle the password reset on mount (Supabase handles the token via URL hash)
  useEffect(() => {
    const handleHashChange = async () => {
      // Supabase puts the access token in the URL hash
      if (window.location.hash) {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Exchange the hash params for a session
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
        }
      }
    };
    handleHashChange();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("הסיסמאות לא תואמות");
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        if (updateError.message.includes("same")) {
          setError("הסיסמה החדשה חייבת להיות שונה מהקודמת");
        } else {
          setError("שגיאה בעדכון הסיסמה. נסה שוב.");
        }
        console.error(updateError);
      } else {
        setSuccess(true);
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (err) {
      console.error("Update password error:", err);
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
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">הסיסמה עודכנה!</h2>
              <p className="text-gray-500 mb-6">מעביר אותך לדשבורד...</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">סיסמה חדשה</h1>
              <p className="text-gray-500 text-center mb-8">בחר סיסמה חדשה לחשבון שלך</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="סיסמה חדשה"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
                  required
                  dir="ltr"
                  minLength={6}
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="אימות סיסמה"
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
                  {loading ? "מעדכן..." : "עדכן סיסמה"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
