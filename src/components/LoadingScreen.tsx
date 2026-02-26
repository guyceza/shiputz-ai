'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Construction worker animation from LottieFiles CDN
const ANIMATION_URL = 'https://assets1.lottiefiles.com/packages/lf20_1pxqjqps.json';

interface LoadingScreenProps {
  text?: string;
  tip?: string;
}

export default function LoadingScreen({ text = "טוען...", tip }: LoadingScreenProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loadAttempted, setLoadAttempted] = useState(false);

  useEffect(() => {
    // Try CDN first, then local fallback
    fetch(ANIMATION_URL)
      .then(res => {
        if (!res.ok) throw new Error('CDN failed');
        return res.json();
      })
      .then(data => setAnimationData(data))
      .catch(() => {
        // Fallback to local file
        fetch('/loading-animation.json')
          .then(res => res.json())
          .then(data => setAnimationData(data))
          .catch(() => {});
      })
      .finally(() => setLoadAttempted(true));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center">
      <div className="text-3xl font-bold text-gray-900 mb-6">ShiputzAI</div>
      
      {animationData ? (
        <Lottie 
          animationData={animationData} 
          loop={true}
          style={{ width: 300, height: 280 }}
        />
      ) : loadAttempted ? (
        <div className="text-6xl mb-4">🏗️</div>
      ) : (
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      <p className="text-gray-600 font-medium mt-4">{text}</p>
      {tip && <p className="text-gray-400 text-sm mt-2">{tip}</p>}
    </div>
  );
}
