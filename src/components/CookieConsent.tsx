'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'shiputz_cookie_consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-3 left-3 z-50 max-w-[calc(100vw-1.5rem)] animate-in slide-in-from-bottom-2 duration-300 md:left-auto md:right-4 md:max-w-xl">
      <div className="rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur md:px-4">
        <div className="flex items-center gap-2 text-right md:gap-3">
          <p className="max-w-[12rem] truncate text-[11px] leading-5 text-gray-600 sm:max-w-none sm:text-xs md:text-sm">
            אנחנו משתמשים בעוגיות לשיפור החוויה ולניתוח שימוש באתר.
          </p>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleAccept}
              className="rounded-full bg-gray-950 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-800 md:px-5 md:py-2 md:text-sm"
            >
              מאשר
            </button>
            <Link
              href="/privacy"
              className="hidden text-xs text-gray-500 transition-colors hover:text-gray-700 sm:inline md:text-sm"
            >
              מדיניות פרטיות
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
