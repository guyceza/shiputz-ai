"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [resetList, setResetList] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email === "guyceza@gmail.com") {
            setIsAdmin(true);
            setAdminEmail(user.email);
            loadResetList();
          } else {
            router.push("/");
          }
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/");
      }
      setLoading(false);
    };
    checkAdmin();
  }, [router]);

  const loadResetList = async () => {
    try {
      const res = await fetch("/api/admin/trial-reset");
      const data = await res.json();
      setResetList(data.list || []);
    } catch (e) {
      console.error("Failed to load reset list:", e);
    }
  };

  const addToResetList = async () => {
    if (!resetEmail) return;
    
    try {
      const res = await fetch("/api/admin/trial-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, adminEmail })
      });
      const data = await res.json();
      
      if (data.success) {
        setResetList(data.list);
        setMessage(`✅ ${resetEmail} נוסף לרשימת איפוס`);
        setResetEmail("");
      } else {
        setMessage(`❌ שגיאה: ${data.error}`);
      }
    } catch (e) {
      setMessage("❌ שגיאה בשמירה");
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const removeFromResetList = async (email: string) => {
    try {
      const res = await fetch("/api/admin/trial-reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, adminEmail })
      });
      const data = await res.json();
      
      if (data.success) {
        setResetList(data.list);
      }
    } catch (e) {
      console.error("Failed to remove:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">טוען...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ניהול מערכת</h1>
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
            ← חזרה לדשבורד
          </Link>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl ${message.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Reset Trial Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔄 איפוס ניסיון חינמי</h2>
          <p className="text-gray-500 text-sm mb-4">
            הכנס אימייל של משתמש כדי לאפס את הניסיון החינמי שלו. 
            האיפוס יתבצע אוטומטית בכניסה הבאה שלו לאתר.
          </p>
          
          <div className="flex gap-4 mb-6">
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="example@email.com"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900"
              dir="ltr"
            />
            <button
              onClick={addToResetList}
              disabled={!resetEmail}
              className="bg-gray-900 text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              אפס ניסיון
            </button>
          </div>

          {resetList.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">ממתינים לאיפוס ({resetList.length}):</h3>
              <div className="space-y-2">
                {resetList.map(email => (
                  <div key={email} className="flex items-center justify-between bg-amber-50 px-4 py-3 rounded-lg">
                    <span className="text-sm text-gray-700 font-mono" dir="ltr">{email}</span>
                    <button
                      onClick={() => removeFromResetList(email)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      הסר
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resetList.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-4">אין משתמשים בתור לאיפוס</p>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">📝 איך זה עובד</h2>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>1. הכנס את האימייל של המשתמש ולחץ "אפס ניסיון"</li>
            <li>2. המשתמש יופיע ברשימת "ממתינים לאיפוס"</li>
            <li>3. כשהמשתמש יכנס לדף /visualize או /shop-look, הניסיון שלו יתאפס</li>
            <li>4. המשתמש יוסר אוטומטית מהרשימה אחרי האיפוס</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
