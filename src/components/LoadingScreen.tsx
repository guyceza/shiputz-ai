'use client';

interface LoadingScreenProps {
  text?: string;
  tip?: string;
}

export default function LoadingScreen({ text = "טוען...", tip }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center">
      <div className="text-3xl font-bold text-gray-900 mb-6">ShiputzAI</div>
      
      {/* Animated Construction Worker Scene */}
      <div className="relative w-64 h-48 mb-6">
        {/* House being built */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-24 bg-amber-100 border-2 border-amber-300 rounded-t-lg">
          {/* Roof being placed - animated */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[70px] border-r-[70px] border-b-[32px] border-l-transparent border-r-transparent border-b-orange-400 animate-bounce" style={{ animationDuration: '2s' }} />
          {/* Window */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-6 bg-sky-200 border border-amber-400" />
          {/* Door */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-10 bg-amber-700 rounded-t" />
        </div>
        
        {/* Worker emoji with tools - bouncing */}
        <div className="absolute bottom-0 right-4 text-5xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '1.5s' }}>
          👷
        </div>
        
        {/* Floating bricks */}
        <div className="absolute top-4 left-8 text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>🧱</div>
        <div className="absolute top-8 right-12 text-2xl animate-bounce" style={{ animationDelay: '0.8s' }}>🧱</div>
        
        {/* Tools */}
        <div className="absolute bottom-2 left-4 text-2xl">🔨</div>
      </div>
      
      <p className="text-gray-600 font-medium">{text}</p>
      {tip && <p className="text-gray-400 text-sm mt-2 max-w-md text-center px-4">{tip}</p>}
    </div>
  );
}
