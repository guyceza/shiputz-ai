'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  // Bug #18 fix: Use ref instead of state for the handled flag
  // State updates are async, so multiple calls could pass the check before state updates
  const handledRef = useRef(false);

  const handleUserSession = async (session: any) => {
    // Prevent double execution using ref (synchronous)
    if (handledRef.current) return;
    handledRef.current = true;
    const email = session.user.email;
    const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
    
    // Check admin status from server
    let isAdmin = false;
    try {
      const adminRes = await fetch(`/api/admin/check?email=${encodeURIComponent(email)}`);
      const adminData = await adminRes.json();
      isAdmin = adminData.isAdmin;
    } catch (e) {
      console.error('Admin check failed:', e);
    }
    
    // Store user info
    localStorage.setItem("user", JSON.stringify({ 
      email,
      id: session.user.id,
      name,
      isAdmin
    }));
    
    // Check if new user (created in last 60 seconds)
    const createdAt = new Date(session.user.created_at).getTime();
    const now = Date.now();
    const isNewUser = (now - createdAt) < 60000; // 60 seconds
    
    // Also check if they've completed onboarding (stored in metadata)
    const hasCompletedOnboarding = session.user.user_metadata?.onboarding_complete;
    
    // Save to users table with Google provider - await before redirecting
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, auth_provider: 'google' }),
      });
    } catch (e) {
      console.error('User save failed:', e);
    }
    
    if (isNewUser && !hasCompletedOnboarding) {
      router.push('/onboarding');
    } else {
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const { getSession, onAuthStateChange } = await import('@/lib/auth');
        
        // Check if we already have a session (tokens processed from URL)
        const session = await getSession();
        if (session) {
          handleUserSession(session);
          return;
        }

        // Wait for auth state change (Supabase processing the hash)
        const { data: { subscription } } = onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            handleUserSession(session);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          setError('הזמן קצוב פג. נסה שוב.');
        }, 10000);

      } catch (err) {
        console.error('Auth callback error:', err);
        setError('שגיאה בהתחברות');
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            חזרה להתחברות
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">מתחבר...</p>
      </div>
    </div>
  );
}
