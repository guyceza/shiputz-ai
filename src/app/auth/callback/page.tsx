'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Dynamically import to avoid SSR issues
        const { getSession, onAuthStateChange } = await import('@/lib/auth');
        
        // Check if we already have a session (tokens processed from URL)
        const session = await getSession();
        if (session) {
          // Store user info
          localStorage.setItem("user", JSON.stringify({ 
            email: session.user.email,
            id: session.user.id,
            isAdmin: session.user.email === "guyceza@gmail.com"
          }));
          router.push('/dashboard');
          return;
        }

        // Wait for auth state change (Supabase processing the hash)
        const { data: { subscription } } = onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            localStorage.setItem("user", JSON.stringify({ 
              email: session.user.email,
              id: session.user.id,
              isAdmin: session.user.email === "guyceza@gmail.com"
            }));
            subscription.unsubscribe();
            router.push('/dashboard');
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
