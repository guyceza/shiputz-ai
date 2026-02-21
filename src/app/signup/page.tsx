"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session) {
          router.push("/dashboard");
        }
      } catch (e) {
        console.error("Auth check error:", e);
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!name || !email || !password) {
      setError("נא למלא את כל השדות");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      setLoading(false);
      return;
    }

    try {
      const { signUp } = await import("@/lib/auth");
      const data = await signUp(email, password, name);
      
      // Also save to users table for email sequences
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name }),
        });
      } catch (err) {
        console.error('Failed to save user to DB:', err);
      }

      if (data.user && !data.user.identities?.length) {
        // User already exists
        setError("משתמש עם אימייל זה כבר קיים. נסה להתחבר.");
      } else if (data.session) {
        // Auto-confirmed (if email confirmation is disabled)
        localStorage.setItem("user", JSON.stringify({ 
          email: data.user?.email,
          id: data.user?.id,
          name,
          isAdmin: email === "guyceza@gmail.com"
        }));
        router.push("/dashboard");
      } else {
        // Email confirmation required
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.message?.includes("already registered")) {
        setError("משתמש עם אימייל זה כבר קיים");
      } else if (err.message?.includes("valid email")) {
        setError("כתובת אימייל לא תקינה");
      } else if (err.message?.includes("password")) {
        setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      } else {
        setError("שגיאה בהרשמה. נסה שוב.");
      }
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">טוען...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <nav className="h-11 border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
            <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">✉️</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">בדוק את האימייל שלך</h1>
            <p className="text-gray-600 mb-6">
              שלחנו לך קישור לאישור ל-<br/>
              <span className="font-medium text-gray-900">{email}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              לא קיבלת? בדוק בתיקיית הספאם
            </p>
            <Link 
              href="/login"
              className="text-gray-900 hover:underline"
            >
              חזור להתחברות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="h-11 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">הרשמה</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="שם מלא"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="אימייל"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
              required
              dir="ltr"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה (לפחות 6 תווים)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
              required
              dir="ltr"
              minLength={6}
            />

            {error && (
              <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-full text-base hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "נרשם..." : "הרשמה"}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8">
            יש לך חשבון?{" "}
            <Link href="/login" className="text-gray-900 hover:underline">התחברות</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
