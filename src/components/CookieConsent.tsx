'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const COOKIE_CONSENT_KEY = 'shiputz_cookie_consent';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    // Check if user already consented
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }

    // Load animation
    fetch('/cookie-animation.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load cookie animation:', err));
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
        <div className="flex items-start gap-4">
          {/* Cookie Animation */}
          <div className="flex-shrink-0 w-16 h-16">
            {animationData ? (
              <Lottie 
                animationData={animationData} 
                loop={true}
                style={{ width: 64, height: 64 }}
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-full" />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              אנחנו משתמשים בעוגיות כדי לשפר את החוויה שלך באתר ולהבין איך אתה משתמש בו.
            </p>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleAccept}
                className="bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                מאשר
              </button>
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                מדיניות פרטיות
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
