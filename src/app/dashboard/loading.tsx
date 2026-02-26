'use client';

import Lottie from 'lottie-react';
import { useEffect, useState } from 'react';

export default function Loading() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/loading-animation.json')
      .then(res => res.json())
      .then(data => setAnimationData(data));
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 z-50">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">ShiputzAI</h1>
      {animationData ? (
        <Lottie 
          animationData={animationData} 
          loop={true}
          style={{ width: 200, height: 200 }}
        />
      ) : (
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      )}
      <p className="mt-4 text-gray-500 dark:text-gray-400">טוען את האזור האישי...</p>
    </div>
  );
}
