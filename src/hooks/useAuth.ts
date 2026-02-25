'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isPremium: boolean;
  hasVisionSub: boolean;
  isAdmin: boolean;
}

export function useAuth(options?: { requireAuth?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isPremium: false,
    hasVisionSub: false,
    isAdmin: false,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSession } = await import('@/lib/auth');
        const session = await getSession();
        
        if (session?.user) {
          const user = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
          };
          
          // Check premium & vision in parallel
          const [premiumRes, visionRes] = await Promise.all([
            fetch(`/api/admin/premium?email=${encodeURIComponent(user.email)}`).catch(() => null),
            fetch(`/api/check-vision?email=${encodeURIComponent(user.email)}`).catch(() => null),
          ]);
          
          let isPremium = false;
          let hasVisionSub = false;
          
          if (premiumRes?.ok) {
            const data = await premiumRes.json();
            isPremium = data.hasPremium === true;
          }
          
          if (visionRes?.ok) {
            const data = await visionRes.json();
            hasVisionSub = data.hasSubscription === true;
          }
          
          setState({
            user,
            loading: false,
            isPremium,
            hasVisionSub,
            isAdmin: user.email === 'guyceza@gmail.com',
          });
        } else {
          // Fallback to localStorage
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const parsed = JSON.parse(userData);
              
              // Still check premium status from API for localStorage users
              let isPremium = parsed.purchased || false;
              let hasVisionSub = false;
              
              if (parsed.email) {
                const [premiumRes, visionRes] = await Promise.all([
                  fetch(`/api/admin/premium?email=${encodeURIComponent(parsed.email)}`).catch(() => null),
                  fetch(`/api/check-vision?email=${encodeURIComponent(parsed.email)}`).catch(() => null),
                ]);
                
                if (premiumRes?.ok) {
                  const data = await premiumRes.json();
                  isPremium = data.hasPremium === true;
                }
                
                if (visionRes?.ok) {
                  const data = await visionRes.json();
                  hasVisionSub = data.hasSubscription === true;
                }
              }
              
              setState({
                user: {
                  id: parsed.id,
                  email: parsed.email,
                  name: parsed.name,
                },
                loading: false,
                isPremium,
                hasVisionSub,
                isAdmin: parsed.email === 'guyceza@gmail.com' || parsed.isAdmin === true,
              });
            } catch {
              if (options?.requireAuth) router.push('/login');
              setState(s => ({ ...s, loading: false }));
            }
          } else {
            if (options?.requireAuth) router.push('/login');
            setState(s => ({ ...s, loading: false }));
          }
        }
      } catch (err) {
        console.error('Auth error:', err);
        setState(s => ({ ...s, loading: false }));
        if (options?.requireAuth) router.push('/login');
      }
    };
    
    checkAuth();
  }, [router, options?.requireAuth]);

  return state;
}

// Helper to get admin status synchronously (for components that need it immediately)
export function getIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.isAdmin === true || user.email === 'guyceza@gmail.com';
  } catch {
    return false;
  }
}
