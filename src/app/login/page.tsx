"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
          router.push(redirectTo);
        }
      } catch (e) {
        console.error("Auth check error:", e);
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router, redirectTo]);

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
      // Check if user registered with Google
      const providerCheck = await fetch(`/api/auth/check-provider?email=${encodeURIComponent(email)}`);
      const providerData = await providerCheck.json();
      
      if (providerData.exists && providerData.provider === 'google') {
        setError("משתמש זה רשום דרך Google. נא להתחבר עם Google למטה.");
        setLoading(false);
        return;
      }

      const { signIn } = await import("@/lib/auth");
      const data = await signIn(email, password);
      
      if (data.user && data.user.email) {
        // Fetch user data including purchase status and name from DB
        let purchased = false;
        let userName = "";
        try {
          const userRes = await fetch(`/api/users?email=${encodeURIComponent(data.user.email)}`);
          if (userRes.ok) {
            const userData = await userRes.json();
            purchased = userData.purchased === true;
            userName = userData.name || "";
          }
        } catch (e) {
          console.error("Failed to fetch user data:", e);
        }
        
        // Store user info in localStorage for quick access
        localStorage.setItem("user", JSON.stringify({ 
          email: data.user.email,
          id: data.user.id,
          name: userName,
          isAdmin: data.user.email === "guyceza@gmail.com",
          purchased: purchased
        }));
        router.push(redirectTo);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.message?.includes("Invalid login credentials")) {
        setError("אימייל או סיסמה לא נכונים");
      } else if (err.message?.includes("Email not confirmed")) {
        setError("נא לאשר את האימייל שנשלח אליך");
      } else {
        setError("שגיאה בהתחברות. נסו שוב.");
      }
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-6">ShiputzAI</div>
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">טוען...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <nav className="h-11 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center">
          <Link href="/" className="text-base font-semibold text-gray-900 dark:text-white">ShiputzAI</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white text-center mb-8">התחברות</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="אימייל"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-base focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              required
              dir="ltr"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                className="w-full px-4 py-3 pl-12 border border-gray-200 dark:border-gray-700 rounded-xl text-base focus:outline-none focus:border-gray-900 dark:focus:border-gray-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-full text-base hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? "מתחבר..." : "התחברות"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400">או</span>
            </div>
          </div>

          <button
            onClick={async () => {
              const { signInWithGoogle } = await import("@/lib/auth");
              await signInWithGoogle();
            }}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-full text-base hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            המשך עם Google
          </button>

          <p className="text-center text-gray-500 dark:text-gray-400 mt-6">
            <Link href="/forgot-password" className="text-gray-900 dark:text-white hover:underline">שכחתי סיסמה</Link>
          </p>

          <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
            אין לך חשבון?{" "}
            <Link href="/signup" className="text-gray-900 dark:text-white hover:underline">הרשמה</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-6">ShiputzAI</div>
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">טוען...</p>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
