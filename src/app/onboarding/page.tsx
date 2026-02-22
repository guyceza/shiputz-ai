'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSession } = await import('@/lib/auth');
        const session = await getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        // Pre-fill email from Google
        setEmail(session.user.email || '');
        
        // If already has name in metadata, pre-fill
        if (session.user.user_metadata?.name) {
          setName(session.user.user_metadata.name);
        } else if (session.user.user_metadata?.full_name) {
          setName(session.user.user_metadata.full_name);
        }
        
      } catch (e) {
        console.error('Auth check error:', e);
        router.push('/login');
      }
      setCheckingAuth(false);
    };
    
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vghfcdtzywbmlacltnjp.supabase.co';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaGZjZHR6eXdibWxhY2x0bmpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NjE3MTcsImV4cCI6MjA4NzIzNzcxN30.EUwH73NbfQ3eeAbu32YicJlHrxngf4WGgi2E6mNOnhw';
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Update user metadata with name and onboarding complete flag
      const { error } = await supabase.auth.updateUser({
        data: { 
          name: name.trim(),
          onboarding_complete: true 
        }
      });
      
      if (error) throw error;
      
      // Update localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.name = name.trim();
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      router.push('/dashboard');
      
    } catch (err) {
      console.error('Onboarding error:', err);
      setLoading(false);
    }
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
          <h1 className="text-3xl font-semibold text-gray-900 text-center mb-2">ברוך הבא! 👋</h1>
          <p className="text-gray-500 text-center mb-8">רק עוד פרט אחד קטן</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-2">שם מלא</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ישראל ישראלי"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:border-gray-900"
                required
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-2">אימייל</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-base bg-gray-50 text-gray-500"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1">מחובר דרך Google</p>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full bg-gray-900 text-white py-3 rounded-full text-base hover:bg-gray-800 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? 'שומר...' : 'בואו נתחיל'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
