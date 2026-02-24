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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

    if (!acceptedTerms) {
      setError("יש לאשר את תנאי השימוש");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      setLoading(false);
      return;
    }

    try {
      // Check if user already exists with Google
      const providerCheck = await fetch(`/api/auth/check-provider?email=${encodeURIComponent(email)}`);
      const providerData = await providerCheck.json();
      
      if (providerData.exists && providerData.provider === 'google') {
        setError("משתמש זה כבר רשום דרך Google. נא להתחבר עם Google.");
        setLoading(false);
        return;
      }

      const { signUp } = await import("@/lib/auth");
      const data = await signUp(email, password, name);
      
      // Save to users table (welcome email will be sent after email verification in callback)
      console.log('🚀 Signup success, saving user:', email);
      
      try {
        const userRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, auth_provider: 'email', auth_id: data.user?.id }),
        });
        const userData = await userRes.json();
        console.log('👤 User save result:', userData);
      } catch (e) {
        console.error('❌ User save failed:', e);
      }
      
      // Note: Welcome email is sent AFTER user verifies email (in /auth/callback)

      if (data.user && !data.user.identities?.length) {
        // User already exists
        setError("משתמש עם אימייל זה כבר קיים. נסו להתחבר.");
      } else if (data.session) {
        // Auto-confirmed (if email confirmation is disabled)
        localStorage.setItem("user", JSON.stringify({ 
          email: data.user?.email,
          id: data.user?.id,
          name,
          isAdmin: email === "guyceza@gmail.com",
          purchased: false  // New users are not premium yet
        }));
        router.push("/dashboard");
      } else {
        // Email confirmation required
        setSuccess(true);
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      const errorMsg = err.message || err.toString();
      if (errorMsg.includes("already registered")) {
        setError("משתמש עם אימייל זה כבר קיים");
      } else if (errorMsg.includes("valid email")) {
        setError("כתובת אימייל לא תקינה");
      } else if (errorMsg.includes("password")) {
        setError("הסיסמה חייבת להכיל לפחות 6 תווים");
      } else if (errorMsg.includes("not initialized")) {
        setError("שגיאת חיבור - נסה לרענן את הדף");
      } else {
        // Show actual error for debugging
        setError(`שגיאה: ${errorMsg}`);
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

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-600">
                קראתי ואני מסכים/ה ל
                <a href="/privacy" className="text-gray-900 underline hover:no-underline" target="_blank">תנאי השימוש ומדיניות הפרטיות</a>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-full text-base hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "נרשם..." : "הרשמה"}
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
              if (!acceptedTerms) {
                setError("יש לאשר את תנאי השימוש לפני ההרשמה");
                return;
              }
              const { signInWithGoogle } = await import("@/lib/auth");
              await signInWithGoogle();
            }}
            className={`w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 py-3 rounded-full text-base transition-colors ${acceptedTerms ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'}`}
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
            יש לך חשבון?{" "}
            <Link href="/login" className="text-gray-900 hover:underline">התחברות</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
