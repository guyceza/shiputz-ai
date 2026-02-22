"use client";

import { useState, useEffect } from "react";

interface AdminPanelProps {
  onClose: () => void;
  adminEmail: string;
}

export default function AdminPanel({ onClose, adminEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'trials' | 'premium' | 'users' | 'stats'>('trials');
  const [resetList, setResetList] = useState<string[]>([]);
  const [premiumList, setPremiumList] = useState<{email: string, days: number, until: string}[]>([]);
  const [bannedList, setBannedList] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [days, setDays] = useState("30");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load trial reset list
      const trialRes = await fetch("/api/admin/trial-reset");
      const trialData = await trialRes.json();
      setResetList(trialData.list || []);
      
      // Load premium list
      const premiumRes = await fetch("/api/admin/premium");
      const premiumData = await premiumRes.json();
      setPremiumList(premiumData.list || []);
      
      // Load banned list
      const bannedRes = await fetch("/api/admin/banned");
      const bannedData = await bannedRes.json();
      setBannedList(bannedData.list || []);
    } catch (e) {
      console.error("Failed to load admin data:", e);
    }
  };

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // Trial actions
  const resetTrial = async () => {
    if (!email) return;
    try {
      const res = await fetch("/api/admin/trial-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, adminEmail })
      });
      const data = await res.json();
      if (data.success) {
        setResetList(data.list);
        showMessage(`✅ הניסיון של ${email} יתאפס בכניסה הבאה`);
        setEmail("");
      }
    } catch (e) {
      showMessage("❌ שגיאה");
    }
  };

  const removeFromResetList = async (emailToRemove: string) => {
    try {
      const res = await fetch("/api/admin/trial-reset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToRemove, adminEmail })
      });
      const data = await res.json();
      if (data.success) setResetList(data.list);
    } catch (e) {
      console.error(e);
    }
  };

  // Premium actions
  const addPremium = async () => {
    if (!email || !days) return;
    try {
      const res = await fetch("/api/admin/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, days: parseInt(days), adminEmail })
      });
      const data = await res.json();
      if (data.success) {
        setPremiumList(data.list);
        showMessage(`✅ ${email} קיבל ${days} ימי פרימיום`);
        setEmail("");
      }
    } catch (e) {
      showMessage("❌ שגיאה");
    }
  };

  const removePremium = async (emailToRemove: string) => {
    try {
      const res = await fetch("/api/admin/premium", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToRemove, adminEmail })
      });
      const data = await res.json();
      if (data.success) {
        setPremiumList(data.list);
        showMessage(`✅ הפרימיום של ${emailToRemove} הוסר`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Ban actions
  const banUser = async () => {
    if (!email) return;
    try {
      const res = await fetch("/api/admin/banned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, adminEmail })
      });
      const data = await res.json();
      if (data.success) {
        setBannedList(data.list);
        showMessage(`🚫 ${email} נחסם`);
        setEmail("");
      }
    } catch (e) {
      showMessage("❌ שגיאה");
    }
  };

  const unbanUser = async (emailToUnban: string) => {
    try {
      const res = await fetch("/api/admin/banned", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUnban, adminEmail })
      });
      const data = await res.json();
      if (data.success) {
        setBannedList(data.list);
        showMessage(`✅ החסימה של ${emailToUnban} הוסרה`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">🔧 פאנל ניהול</h1>
            <p className="text-gray-400 text-sm mt-1">ניהול משתמשים, פרימיום וחסימות</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-center font-medium ${
            message.startsWith('✅') ? 'bg-green-900/50 text-green-300' : 
            message.startsWith('🚫') ? 'bg-orange-900/50 text-orange-300' :
            'bg-red-900/50 text-red-300'
          }`}>
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-700 pb-4">
          <button
            onClick={() => setActiveTab('trials')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'trials' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🔄 ניסיונות חינמיים
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'premium' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            ⭐ פרימיום
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            🚫 חסימות
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            📊 סטטיסטיקות
          </button>
        </div>

        {/* Trials Tab */}
        {activeTab === 'trials' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">איפוס ניסיון חינמי</h2>
              <p className="text-gray-400 text-sm mb-4">
                הכנס אימייל של משתמש כדי לאפס את הניסיון החינמי שלו. האיפוס יתבצע בכניסה הבאה.
              </p>
              <div className="flex gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
                <button
                  onClick={resetTrial}
                  disabled={!email}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                >
                  אפס ניסיון
                </button>
              </div>
            </div>

            {resetList.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">ממתינים לאיפוס ({resetList.length})</h3>
                <div className="space-y-2">
                  {resetList.map(e => (
                    <div key={e} className="flex items-center justify-between bg-gray-700 px-4 py-3 rounded-xl">
                      <span className="text-white font-mono" dir="ltr">{e}</span>
                      <button onClick={() => removeFromResetList(e)} className="text-red-400 hover:text-red-300 px-3">הסר</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Premium Tab */}
        {activeTab === 'premium' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">הוספת ימי פרימיום</h2>
              <p className="text-gray-400 text-sm mb-4">
                הענק למשתמש גישת פרימיום למספר ימים מסוים.
              </p>
              <div className="flex gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
                <select
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                  className="px-4 py-3 bg-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">7 ימים</option>
                  <option value="14">14 ימים</option>
                  <option value="30">30 ימים</option>
                  <option value="90">90 ימים</option>
                  <option value="365">שנה</option>
                </select>
                <button
                  onClick={addPremium}
                  disabled={!email}
                  className="px-8 py-3 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 disabled:opacity-50 transition-all"
                >
                  הוסף פרימיום
                </button>
              </div>
            </div>

            {premiumList.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">משתמשי פרימיום ({premiumList.length})</h3>
                <div className="space-y-2">
                  {premiumList.map(p => (
                    <div key={p.email} className="flex items-center justify-between bg-gray-700 px-4 py-3 rounded-xl">
                      <div>
                        <span className="text-white font-mono" dir="ltr">{p.email}</span>
                        <span className="text-amber-400 text-sm mr-4">⭐ עד {p.until}</span>
                      </div>
                      <button onClick={() => removePremium(p.email)} className="text-red-400 hover:text-red-300 px-3">הסר פרימיום</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {premiumList.length === 0 && (
              <div className="bg-gray-800 rounded-2xl p-8 text-center">
                <p className="text-gray-400">אין משתמשי פרימיום כרגע</p>
              </div>
            )}
          </div>
        )}

        {/* Bans Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">חסימת משתמש</h2>
              <p className="text-gray-400 text-sm mb-4">
                חסום משתמש מגישה לאתר. המשתמש יראה הודעת חסימה בכניסה.
              </p>
              <div className="flex gap-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 px-4 py-3 bg-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
                <button
                  onClick={banUser}
                  disabled={!email}
                  className="px-8 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-all"
                >
                  🚫 חסום משתמש
                </button>
              </div>
            </div>

            {bannedList.length > 0 && (
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">משתמשים חסומים ({bannedList.length})</h3>
                <div className="space-y-2">
                  {bannedList.map(e => (
                    <div key={e} className="flex items-center justify-between bg-red-900/30 px-4 py-3 rounded-xl">
                      <span className="text-white font-mono" dir="ltr">{e}</span>
                      <button onClick={() => unbanUser(e)} className="text-green-400 hover:text-green-300 px-3">הסר חסימה</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bannedList.length === 0 && (
              <div className="bg-gray-800 rounded-2xl p-8 text-center">
                <p className="text-gray-400">אין משתמשים חסומים</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-800 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-white mb-2">{resetList.length}</div>
              <div className="text-gray-400">ממתינים לאיפוס ניסיון</div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-amber-400 mb-2">{premiumList.length}</div>
              <div className="text-gray-400">משתמשי פרימיום</div>
            </div>
            <div className="bg-gray-800 rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold text-red-400 mb-2">{bannedList.length}</div>
              <div className="text-gray-400">משתמשים חסומים</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
