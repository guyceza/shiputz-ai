'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authFetch } from '@/lib/auth-fetch';

// Centralized admin emails - single source of truth
const ADMIN_EMAILS = ['guyceza@gmail.com'];

interface AuthUser {
  id: string;
  email: string;
  name?: string;
  isAdmin: boolean;
  isPremium: boolean;
  hasVisionSub: boolean;
  vizCredits: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isPremium: boolean;
  vizCredits: number;
  refreshUser: () => Promise<void>;
  setVizCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoggedIn: false,
  isAdmin: false,
  isPremium: false,
  vizCredits: 0,
  refreshUser: async () => {},
  setVizCredits: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      // Read from localStorage first (fast)
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) {
          const authUser: AuthUser = {
            id: parsed.id,
            email: parsed.email || '',
            name: parsed.name,
            isAdmin: isAdminEmail(parsed.email || ''),
            isPremium: parsed.purchased === true,
            hasVisionSub: parsed.vision_subscription === true || parsed.vision_subscription === 'active' || parsed.vision_subscription === 'true',
            vizCredits: parsed.viz_credits ?? 0,
          };
          setUser(authUser);

          // Verify against DB (async, non-blocking)
          if (parsed.email) {
            try {
              const res = await authFetch(`/api/admin/premium?email=${encodeURIComponent(parsed.email)}`);
              if (res.ok) {
                const data = await res.json();
                setUser(prev => prev ? {
                  ...prev,
                  isPremium: data.hasPremium || false,
                  hasVisionSub: data.hasVision || false,
                  vizCredits: data.vizCredits ?? prev.vizCredits,
                } : prev);
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                if (storedUser.id) {
                  localStorage.setItem('user', JSON.stringify({
                    ...storedUser,
                    purchased: data.hasPremium || false,
                    vision_subscription: data.hasVision ? 'active' : null,
                    vision_trial_used: data.trialUsed || false,
                    viz_credits: data.vizCredits ?? storedUser.viz_credits,
                  }));
                }
              }
            } catch {}
          }
        }
      }

      // Fallback: check Supabase session
      if (!stored || !JSON.parse(stored).id) {
        const { getSession } = await import('@/lib/auth');
        const session = await getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name,
            isAdmin: isAdminEmail(session.user.email || ''),
            isPremium: false,
            hasVisionSub: false,
            vizCredits: 0,
          });
        }
      }
    } catch {
      // Silent fail - user stays null
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const setVizCredits = (credits: number) => {
    setUser(prev => prev ? { ...prev, vizCredits: credits } : prev);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isLoggedIn: !!user,
      isAdmin: user?.isAdmin ?? false,
      isPremium: user?.isPremium ?? false,
      vizCredits: user?.vizCredits ?? 0,
      refreshUser,
      setVizCredits,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
