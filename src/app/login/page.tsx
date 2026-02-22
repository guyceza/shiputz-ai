"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

    if (!email || !password) {
      setError("נא למלא את כל השדות");
      setLoading(false);
      return;
    }

    try {
      const { signIn } = await import("@/lib/auth");
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">או</span>
            </div>
          </div>

          <button
            onClick={async () => {
              const { signInWithGoogle } = await import("@/lib/auth");
              await signInWithGoogle();
            }}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-full text-base hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            המשך עם Google
          </button>

          <p className="text-center text-gray-500 mt-8">
            אין לך חשבון?{" "}
            <Link href="/signup" className="text-gray-900 hover:underline">הרשמה</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
