"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  purchased: boolean;
  purchased_at: string | null;
  vision_subscription: string | null;
  vision_trial_used: boolean;
  created_at: string;
  newsletter: boolean;
  banned: boolean;
}

interface WhopMembership {
  id: string;
  product: string;
  productId: string;
  plan: string;
  planId: string;
  status: string;
  createdAt: string | null;
  renewalPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  totalSpent: number;
}

interface Stats {
  total: number;
  premium: number;
  vision: number;
  trialUsed: number;
  newsletter: number;
}

const ADMIN_EMAILS = ['guyceza@gmail.com'];

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [whopData, setWhopData] = useState<{ memberships: WhopMembership[], totalRevenue: number } | null>(null);
  const [whopLoading, setWhopLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Auth check
  useEffect(() => {
    const checkAuth = async () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
            setAdminEmail(user.email);
            return;
          }
        } catch (e) {
          console.error("Failed to parse user data:", e);
        }
      }
      
      // Try to get session from Supabase
      try {
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
          setAdminEmail(session.user.email);
          // Also fix localStorage if it was broken
          localStorage.setItem("user", JSON.stringify({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || "",
            isAdmin: true
          }));
          return;
        }
      } catch (e) {
        console.error("Session check failed:", e);
      }
      
      // Not admin - redirect
      router.push("/dashboard");
    };
    
    checkAuth();
  }, [router]);
  
  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!adminEmail) return;
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        adminEmail,
        search,
        filter,
        page: page.toString(),
        limit: "50",
      });
      
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setUsers(data.users);
        setStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
    
    setLoading(false);
  }, [adminEmail, search, filter, page]);
  
  useEffect(() => {
    if (adminEmail) {
      fetchUsers();
    }
  }, [adminEmail, fetchUsers]);
  
  // Fetch Whop data for selected user
  const fetchWhopData = async (email: string) => {
    if (!adminEmail) return;
    setWhopLoading(true);
    setWhopData(null);
    
    try {
      const res = await fetch(`/api/admin/whop?adminEmail=${adminEmail}&email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setWhopData(data);
    } catch (error) {
      console.error("Failed to fetch Whop data:", error);
    }
    
    setWhopLoading(false);
  };
  
  // Handle user selection
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    fetchWhopData(user.email);
  };
  
  // Update user
  const updateUser = async (email: string, updates: Partial<User>) => {
    if (!adminEmail) return;
    setActionLoading(email);
    
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail, userEmail: email, updates }),
      });
      
      if (res.ok) {
        // Refresh users
        await fetchUsers();
        // Update selected user if it's the same
        if (selectedUser?.email === email) {
          setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
        }
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
    
    setActionLoading(null);
  };
  
  // Toggle premium
  const togglePremium = async (user: User) => {
    await updateUser(user.email, { purchased: !user.purchased });
  };
  
  // Reset trial
  const resetTrial = async (user: User) => {
    await updateUser(user.email, { vision_trial_used: false });
  };
  
  // Toggle vision
  const toggleVision = async (user: User) => {
    const newStatus = user.vision_subscription === 'active' ? null : 'active';
    await updateUser(user.email, { vision_subscription: newStatus });
  };
  
  // Ban/unban user
  const toggleBan = async (user: User) => {
    if (!adminEmail) return;
    setActionLoading(user.email);
    
    try {
      const res = await fetch("/api/admin/banned", {
        method: user.banned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, adminEmail }),
      });
      
      if (res.ok) {
        await fetchUsers();
        if (selectedUser?.email === user.email) {
          setSelectedUser(prev => prev ? { ...prev, banned: !prev.banned } : null);
        }
      }
    } catch (error) {
      console.error("Failed to toggle ban:", error);
    }
    
    setActionLoading(null);
  };
  
  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };
  
  if (!adminEmail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
              ← חזרה
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">ניהול משתמשים</h1>
          </div>
          <div className="text-sm text-gray-500">
            מחובר כ: {adminEmail}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">סה״כ משתמשים</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">פרימיום</p>
              <p className="text-2xl font-semibold text-green-600">{stats.premium}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">Vision מנויים</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.vision}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">ניסו Trial</p>
              <p className="text-2xl font-semibold text-orange-600">{stats.trialUsed}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-500">ניוזלטר</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.newsletter}</p>
            </div>
          </div>
        )}
        
        {/* Search & Filter */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="חיפוש לפי אימייל או שם..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="flex gap-2">
              {[
                { id: "all", label: "הכל" },
                { id: "premium", label: "פרימיום" },
                { id: "free", label: "חינמי" },
                { id: "vision", label: "Vision" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setFilter(f.id); setPage(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === f.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">משתמש</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">סטטוס</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">תאריך הצטרפות</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Trial</th>
                      <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedUser?.id === user.id ? 'bg-blue-50' : ''} ${user.banned ? 'bg-red-50' : ''}`}
                        onClick={() => handleSelectUser(user)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                              {user.name?.[0] || user.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name || "(ללא שם)"}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            {user.banned && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">חסום</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.purchased && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">פרימיום</span>
                            )}
                            {user.vision_subscription === 'active' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Vision</span>
                            )}
                            {user.newsletter && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">ניוזלטר</span>
                            )}
                            {!user.purchased && !user.vision_subscription && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">חינמי</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          {user.vision_trial_used ? (
                            <span className="text-orange-600 text-sm">נוצל</span>
                          ) : (
                            <span className="text-gray-400 text-sm">לא נוצל</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => togglePremium(user)}
                              disabled={actionLoading === user.email}
                              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                user.purchased
                                  ? "bg-red-100 text-red-700 hover:bg-red-200"
                                  : "bg-green-100 text-green-700 hover:bg-green-200"
                              }`}
                            >
                              {user.purchased ? "בטל" : "הפעל"} פרימיום
                            </button>
                            {user.vision_trial_used && (
                              <button
                                onClick={() => resetTrial(user)}
                                disabled={actionLoading === user.email}
                                className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700 hover:bg-orange-200"
                              >
                                אפס Trial
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                  >
                    הקודם
                  </button>
                  <span className="text-sm text-gray-500">
                    עמוד {page} מתוך {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-50"
                  >
                    הבא
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* User Details Sidebar */}
        {selectedUser && (
          <div className="fixed inset-y-0 left-0 w-96 bg-white border-r border-gray-200 shadow-xl z-50 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">פרטי משתמש</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              {/* User Info */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl font-medium text-gray-600 mx-auto mb-4">
                  {selectedUser.name?.[0] || selectedUser.email[0].toUpperCase()}
                </div>
                <h3 className="text-center font-medium text-gray-900">{selectedUser.name || "(ללא שם)"}</h3>
                <p className="text-center text-sm text-gray-500 mb-2">{selectedUser.email}</p>
                <div className="flex justify-center flex-wrap gap-1">
                  {selectedUser.purchased && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">פרימיום</span>
                  )}
                  {selectedUser.vision_subscription === 'active' && (
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Vision</span>
                  )}
                  {selectedUser.banned && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">חסום</span>
                  )}
                </div>
              </div>
              
              {/* Details */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">תאריך הרשמה:</span>
                  <span className="text-gray-900">{formatDate(selectedUser.created_at)}</span>
                </div>
                {selectedUser.purchased && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">רכישת פרימיום:</span>
                    <span className="text-gray-900">{formatDate(selectedUser.purchased_at)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Vision Trial:</span>
                  <span className={selectedUser.vision_trial_used ? "text-orange-600" : "text-green-600"}>
                    {selectedUser.vision_trial_used ? "נוצל" : "לא נוצל"}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => togglePremium(selectedUser)}
                  disabled={actionLoading === selectedUser.email}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedUser.purchased
                      ? "bg-red-100 text-red-700 hover:bg-red-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {selectedUser.purchased ? "בטל פרימיום" : "הפעל פרימיום"}
                </button>
                
                <button
                  onClick={() => toggleVision(selectedUser)}
                  disabled={actionLoading === selectedUser.email}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedUser.vision_subscription === 'active'
                      ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  }`}
                >
                  {selectedUser.vision_subscription === 'active' ? "בטל Vision" : "הפעל Vision"}
                </button>
                
                {selectedUser.vision_trial_used && (
                  <button
                    onClick={() => resetTrial(selectedUser)}
                    disabled={actionLoading === selectedUser.email}
                    className="w-full py-2 rounded-lg text-sm font-medium bg-orange-100 text-orange-700 hover:bg-orange-200"
                  >
                    אפס Trial
                  </button>
                )}
                
                <button
                  onClick={() => toggleBan(selectedUser)}
                  disabled={actionLoading === selectedUser.email}
                  className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedUser.banned
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {selectedUser.banned ? "בטל חסימה" : "חסום משתמש"}
                </button>
              </div>
              
              {/* Whop Data */}
              <div className="border-t border-gray-100 pt-6">
                <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <img src="https://whop.com/favicon.ico" alt="" className="w-4 h-4" />
                  נתוני Whop
                </h4>
                
                {whopLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                ) : whopData?.memberships && whopData.memberships.length > 0 ? (
                  <div className="space-y-3">
                    {whopData.memberships.map((m) => (
                      <div key={m.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-sm text-gray-900">{m.product}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            m.status === 'active' ? 'bg-green-100 text-green-700' :
                            m.status === 'canceled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>תוכנית: {m.plan}</p>
                          <p>נרכש: {formatDate(m.createdAt)}</p>
                          {m.renewalPeriodEnd && (
                            <p>חידוש: {formatDate(m.renewalPeriodEnd)}</p>
                          )}
                          {m.cancelAtPeriodEnd && (
                            <p className="text-red-600">מתבטל בסוף התקופה</p>
                          )}
                          <p className="font-medium text-gray-700">סה״כ: {formatCurrency(m.totalSpent)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">סה״כ הכנסות מהמשתמש</p>
                      <p className="text-xl font-semibold text-green-700">{formatCurrency(whopData.totalRevenue)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">אין רכישות ב-Whop</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
