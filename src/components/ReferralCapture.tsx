'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Captures ?ref=CODE from URL and stores in localStorage.
 * Used during signup to credit both referrer and new user.
 */
export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      localStorage.setItem('referralCode', ref.toUpperCase());
    }
  }, [searchParams]);

  return null;
}
