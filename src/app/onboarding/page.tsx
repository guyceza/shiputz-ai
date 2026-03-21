'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoleSelector, { ROLES } from '@/components/RoleSelector';
import type { Role } from '@/components/RoleSelector';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'name'>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
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
        
        setEmail(session.user.email || '');
        
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

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('name');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !selectedRole) return;
    
    setLoading(true);
    
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      
      const { error } = await supabase.auth.updateUser({
        data: { 
          name: name.trim(),
          role: selectedRole.key,
          onboarding_complete: true 
        }
      });
      
      if (error) throw error;
      
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        user.name = name.trim();
        user.role = selectedRole.key;
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
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-gray-500">טוען...</p>
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

      {/* Progress */}
      <div className="max-w-sm mx-auto w-full px-6 pt-6">
        <div className="flex gap-2">
          <div className={`flex-1 h-1 rounded-full ${step === 'role' || step === 'name' ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-1 rounded-full ${step === 'name' ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8">
        {/* Step 1: Role Selection */}
        {step === 'role' && (
          <div className="w-full max-w-2xl animate-in fade-in">
            <RoleSelector onSelect={handleRoleSelect} />
          </div>
        )}

        {/* Step 2: Name */}
        {step === 'name' && selectedRole && (
          <div className="w-full max-w-sm animate-in fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-3xl"
                style={{ background: `${selectedRole.color}15` }}>
                {selectedRole.key === "homeowner" && "🏠"}
                {selectedRole.key === "designer" && "🎨"}
                {selectedRole.key === "architect" && "📐"}
                {selectedRole.key === "contractor" && "🔨"}
                {selectedRole.key === "realtor" && "🏢"}
                {selectedRole.key === "other" && "✨"}
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                {selectedRole.label}
              </h1>
              <button onClick={() => setStep('role')} className="text-sm text-gray-400 hover:text-gray-600">
                לא אני? שנה תפקיד
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-2">שם מלא</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ישראל ישראלי"
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-base focus:outline-none focus:border-gray-900 dark:focus:border-white bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                  className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-xl text-base bg-gray-50 dark:bg-gray-800 text-gray-500"
                  dir="ltr"
                />
                <p className="text-xs text-gray-400 mt-1">מחובר דרך Google</p>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-3 rounded-full text-base font-medium transition-colors disabled:opacity-50 mt-6 text-white"
                style={{ background: selectedRole.color }}
              >
                {loading ? 'שומר...' : 'בואו נתחיל'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
