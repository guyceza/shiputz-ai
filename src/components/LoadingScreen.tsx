'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Home/House animation from LottieFiles CDN
const ANIMATION_URL = 'https://assets9.lottiefiles.com/private_files/lf30_p5tali1o.json';

interface LoadingScreenProps {
  text?: string;
  tip?: string;
}

export default function LoadingScreen({ text = "טוען...", tip }: LoadingScreenProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);

  useEffect(() => {
    fetch(ANIMATION_URL)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(() => {
        // Fallback to local file
        fetch('/loading-animation.json')
          .then(res => res.json())
          .then(data => setAnimationData(data))
          .catch(() => {});
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center">
      <div className="text-3xl font-bold text-gray-900 mb-6">ShiputzAI</div>
      
      {/* Lottie animation - empty placeholder until loaded (no spinner) */}
      <div className="h-[200px] flex items-center justify-center">
        {animationData && (
          <Lottie 
            animationData={animationData} 
            loop={true}
            style={{ width: 350, height: 200 }}
          />
        )}
      </div>
      
      <p className="text-gray-600 font-medium">{text}</p>
      {tip && <p className="text-gray-400 text-sm mt-2 max-w-md text-center px-4">{tip}</p>}
    </div>
  );
}
