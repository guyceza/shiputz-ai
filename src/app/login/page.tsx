"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
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

    if (!email || !password) {
      setError("נא למלא את כל השדות");
      setLoading(false);
      return;
    }

    try {
      const data = await signIn(email, password);
      
      if (data.user) {
        // Store user info in localStorage for quick access
        localStorage.setItem("user", JSON.stringify({ 
          email: data.user.email,
          id: data.user.id,
          isAdmin: data.user.email === "guyceza@gmail.com"
        }));
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message?.includes("Invalid login credentials")) {
        setError("אימייל או סיסמה לא נכונים");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("נא לאשר את האימייל שנשלח אליך");
      } else {
        setError("שגיאה בהתחברות. נסה שוב.");
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="h-11 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="text-base font-semibold text-gray-900">ShiputzAI</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-8">התחברות</h1>

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="סיסמה"
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
              {loading ? "מתחבר..." : "התחברות"}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8">
            אין לך חשבון?{" "}
            <Link href="/signup" className="text-gray-900 hover:underline">הרשמה</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
