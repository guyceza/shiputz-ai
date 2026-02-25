'use client';

import { useState, useEffect } from 'react';

const QUOTE_LOADING_MESSAGES = [
  "משווה למחירי שוק ממדרג...",
  "בודק מחירי קבלנים באזור...",
  "מנתח את סוג העבודה...",
  "מחשב טווח מחירים הוגן...",
  "בודק אם יש פריטים חסרים...",
  "מכין את הניתוח שלך...",
];

export function QuoteLoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(25);
  
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % QUOTE_LOADING_MESSAGES.length);
    }, 3000);
    
    const secondsInterval = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    
    return () => {
      clearInterval(messageInterval);
      clearInterval(secondsInterval);
    };
  }, []);
  
  return (
    <div className="py-16 flex flex-col items-center justify-center">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gray-900 animate-spin"></div>
        <div className="absolute inset-3 rounded-full bg-gray-900 flex items-center justify-center">
          <span className="text-white font-bold text-lg">{secondsLeft}</span>
        </div>
      </div>
      <p className="text-gray-900 font-medium text-lg mb-2">מנתח את ההצעה</p>
      <p className="text-gray-500 text-sm mb-3 h-5 transition-all">{QUOTE_LOADING_MESSAGES[messageIndex]}</p>
    </div>
  );
}
