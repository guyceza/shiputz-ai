'use client';

import { useState, useEffect } from 'react';
import { Camera, Receipt, TrendingUp, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';

export default function HeroAnimation() {
  const [step, setStep] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % 4);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[280px] mx-auto">
      {/* Phone Frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Phone Notch/Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
        
        {/* Screen */}
        <div className="bg-white rounded-[2rem] overflow-hidden h-[520px] relative">
          {/* Status Bar */}
          <div className="bg-emerald-600 text-white px-4 py-2 pt-8">
            <div className="text-xs font-medium">ShiputzAI</div>
            <div className="text-[10px] opacity-80">שיפוץ דירה - רמת גן</div>
          </div>
          
          {/* Content Area */}
          <div className="p-3 space-y-2.5">
            {/* Budget Card */}
            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-600">תקציב</span>
                <span className="text-[10px] text-emerald-600 font-medium">62%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: step >= 1 ? '62%' : '45%' }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
                <span>₪74,500 / ₪120,000</span>
                <span>נותרו ₪45,500</span>
              </div>
            </div>

            {/* Animated Receipt Scan */}
            <div className={`bg-emerald-50 rounded-lg p-2.5 border border-emerald-100 transition-all duration-500 ${step === 0 ? 'opacity-100 scale-100' : 'opacity-60 scale-98'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${step === 0 ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
                  {step === 0 ? (
                    <Camera className="w-4 h-4 animate-pulse" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-800">קבלה נסרקה</div>
                  <div className="text-[10px] text-gray-500">חומרי בניין - ₪2,340</div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className={`bg-blue-50 rounded-lg p-2.5 border border-blue-100 transition-all duration-500 ${step === 1 ? 'opacity-100 scale-100' : 'opacity-60 scale-98'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${step === 1 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'}`}>
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-800">ניתוח AI</div>
                  <div className="text-[10px] text-gray-500">
                    {step >= 1 ? (
                      <span className="text-blue-600">המחיר הוגן ✓</span>
                    ) : (
                      'מנתח...'
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Alert */}
            <div className={`bg-amber-50 rounded-lg p-2.5 border border-amber-100 transition-all duration-500 ${step === 2 ? 'opacity-100 scale-100' : 'opacity-60 scale-98'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${step === 2 ? 'bg-amber-500 text-white animate-bounce' : 'bg-amber-100 text-amber-600'}`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-800">התראה</div>
                  <div className="text-[10px] text-gray-500">חשמל - חריגה של 15%</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className={`grid grid-cols-2 gap-2 transition-all duration-500 ${step === 3 ? 'opacity-100' : 'opacity-60'}`}>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-emerald-600">₪8,500</div>
                <div className="text-[10px] text-gray-500">נחסך החודש</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-gray-800">12</div>
                <div className="text-[10px] text-gray-500">קבלות נסרקו</div>
              </div>
            </div>
            
            {/* Bottom Navigation Mock */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-around">
              <div className="text-center">
                <div className="w-5 h-5 mx-auto mb-0.5 bg-emerald-500 rounded"></div>
                <span className="text-[9px] text-emerald-600 font-medium">בית</span>
              </div>
              <div className="text-center">
                <div className="w-5 h-5 mx-auto mb-0.5 bg-gray-200 rounded"></div>
                <span className="text-[9px] text-gray-400">הוצאות</span>
              </div>
              <div className="text-center">
                <div className="w-5 h-5 mx-auto mb-0.5 bg-gray-200 rounded"></div>
                <span className="text-[9px] text-gray-400">מסמכים</span>
              </div>
              <div className="text-center">
                <div className="w-5 h-5 mx-auto mb-0.5 bg-gray-200 rounded"></div>
                <span className="text-[9px] text-gray-400">עוד</span>
              </div>
            </div>
          </div>
          
          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Floating Elements */}
      <div className={`absolute -right-12 top-24 bg-white rounded-lg shadow-lg p-2 transition-all duration-500 ${step === 0 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
        <div className="flex items-center gap-1.5">
          <Receipt className="w-3 h-3 text-emerald-500" />
          <span className="text-[10px] font-medium">נסרק!</span>
        </div>
      </div>

      <div className={`absolute -left-12 top-44 bg-white rounded-lg shadow-lg p-2 transition-all duration-500 ${step === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-blue-500" />
          <span className="text-[10px] font-medium">מחיר תקין</span>
        </div>
      </div>
    </div>
  );
}
