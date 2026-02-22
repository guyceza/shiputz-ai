"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";

// Add keyframes for animations
const animationStyles = `
@keyframes bounce-in {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes progress-bar {
  0% { width: 0%; }
  100% { width: 100%; }
}
.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}
.animate-progress-bar {
  animation: progress-bar 2s ease-in-out;
}
`;

interface ShopItem {
  x: number;
  y: number;
  title: string;
  price: string;
}

interface ExampleCard {
  id: number;
  title: string;
  beforeImg: string;
  afterImg: string;
  beforeDesc: string;
  afterDesc: string;
  changes: string;
  costs: { item: string; price: number }[];
  total: number;
  shopItems?: ShopItem[];
}

const EXAMPLES: ExampleCard[] = [
  {
    id: 1,
    title: "סלון מודרני",
    beforeImg: "/before-room.jpg",
    afterImg: "/after-room.jpg",
    beforeDesc: "סלון קלאסי עם ריהוט מסורתי, שטיח פרסי ותאורה ישנה",
    afterDesc: "סלון מודרני עם ספה אפורה, כורסה כתומה, תמונות גרפיות ותאורת LED",
    changes: "ריהוט מודרני חדש, תאורת LED, תמונות דקורטיביות, שטיח גיאומטרי",
    costs: [
      { item: "פרקט עץ אלון (25 מ״ר)", price: 6250 },
      { item: "תאורה שקועה (8 ספוטים)", price: 2400 },
      { item: "צביעה (60 מ״ר)", price: 2400 },
      { item: "עבודה", price: 4500 },
    ],
    total: 15550,
    shopItems: [
      { x: 20, y: 45, title: "ספה מודולרית אפורה", price: "₪8,500" },
      { x: 75, y: 55, title: "כורסה כתומה", price: "₪2,200" },
      { x: 45, y: 15, title: "שלישיית תמונות", price: "₪1,800" },
      { x: 8, y: 35, title: "מנורת רצפה", price: "₪1,400" },
      { x: 60, y: 70, title: "שולחן סלון זכוכית", price: "₪1,900" },
      { x: 35, y: 85, title: "שטיח גיאומטרי", price: "₪2,400" },
    ],
  },
  {
    id: 2,
    title: "מטבח כפרי",
    beforeImg: "/examples/kitchen-before.jpg",
    afterImg: "/examples/kitchen-after.jpg",
    beforeDesc: "מטבח מיושן עם ארונות לבנים, אריחי קיר בז׳ ומשטח גרניט חום",
    afterDesc: "מטבח כפרי חם עם ארונות עץ כהים, חיפוי אבן טבעית ומנורות ראטן",
    changes: "ארונות עץ אלון כהה, משטח קוורץ לבן, חיפוי אבן טבעית, מנורות ראטן",
    costs: [
      { item: "חזיתות עץ אלון (4 מטר)", price: 8000 },
      { item: "משטח שיש קיסר", price: 4500 },
      { item: "חיפוי קרמיקה (3 מ״ר)", price: 1800 },
      { item: "עבודה והתקנה", price: 3500 },
    ],
    total: 17800,
    shopItems: [
      { x: 18, y: 12, title: "מנורת ראטן תלויה", price: "₪890" },
      { x: 42, y: 12, title: "מנורת ראטן תלויה", price: "₪890" },
      { x: 30, y: 35, title: "ברז מטבח וינטג׳", price: "₪1,200" },
      { x: 75, y: 45, title: "מדפי עץ פתוחים", price: "₪1,600" },
      { x: 55, y: 65, title: "מדיח כלים נירוסטה", price: "₪3,200" },
      { x: 50, y: 85, title: "שטיח מטבח בוהו", price: "₪450" },
      { x: 10, y: 55, title: "עציץ בזיליקום", price: "₪85" },
    ],
  },
  {
    id: 3,
    title: "חדר שינה מינימליסטי",
    beforeImg: "/examples/bedroom-before.jpg",
    afterImg: "/examples/bedroom-after.jpg",
    beforeDesc: "חדר שינה ישן עם ארון עץ כהה, מיטת יחיד ותאורה פלורסנטית",
    afterDesc: "חדר שינה מינימליסטי עם ארון לבן ומראה, מיטה זוגית אפורה ופרקט עץ",
    changes: "ארון הזזה לבן עם מראה, מיטה זוגית מרופדת, פרקט אלון, תאורה שקועה",
    costs: [
      { item: "ארון הזזה עם מראה (3 מטר)", price: 9500 },
      { item: "פרקט אלון (15 מ״ר)", price: 3750 },
      { item: "תאורה שקועה (6 ספוטים)", price: 1800 },
      { item: "צביעה אפור (45 מ״ר)", price: 1800 },
      { item: "עבודה", price: 3500 },
    ],
    total: 20350,
    shopItems: [
      { x: 18, y: 52, title: "ארון הזזה עם מראה", price: "₪9,500" },
      { x: 62, y: 58, title: "מיטה זוגית מרופדת", price: "₪4,200" },
      { x: 88, y: 52, title: "מנורת שולחן מודרנית", price: "₪380" },
      { x: 85, y: 65, title: "שידת לילה עגולה", price: "₪650" },
      { x: 72, y: 28, title: "תמונת אבסטרקט", price: "₪890" },
      { x: 12, y: 80, title: "כורסת עץ סקנדינבית", price: "₪1,800" },
      { x: 35, y: 90, title: "שטיח גיאומטרי", price: "₪1,200" },
    ],
  },
];

function BeforeAfterSlider({ beforeImg, afterImg, showShopLook = false, shopItems = [] }: { beforeImg: string; afterImg: string; showShopLook?: boolean; shopItems?: ShopItem[] }) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleAfterClick = (e: React.MouseEvent) => {
    if (!isDragging && showShopLook) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clickX = ((e.clientX - rect.left) / rect.width) * 100;
        if (clickX < sliderPosition) {
          setShowModal(true);
        }
      }
    }
  };

  return (
    <>
      <div 
        ref={containerRef}
        className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 select-none touch-none"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        {/* After image (LEFT side) */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img 
            src={afterImg} 
            alt="אחרי" 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-gray-900 text-white text-xs px-2 py-1 rounded">
            אחרי
          </div>
        </div>
        
        {/* Shop the Look Button - only show when after image is visible */}
        {showShopLook && sliderPosition > 20 && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            className="absolute bottom-3 left-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-full flex items-center gap-1.5 shadow-lg transition-colors z-10 pointer-events-auto"
          >
            <img src="/icons/cart.png" alt="" className="w-5 h-5" />
            <span>לחץ לקנות</span>
          </button>
        )}
        
        {/* Before image (RIGHT side) */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
        >
          <img 
            src={beforeImg} 
            alt="לפני" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            לפני
          </div>
        </div>
        
        {/* Slider handle - only this is draggable */}
        <div 
          className="absolute top-0 bottom-0 w-6 cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white shadow-lg -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-gray-400">↔</span>
          </div>
        </div>
      </div>
      
      {/* Shop the Look Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100"
            >
              ✕
            </button>
            
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center flex items-center justify-center gap-2"><img src="/icons/cart.png" alt="" className="w-6 h-6" /> Shop the Look</h3>
              <p className="text-sm text-gray-500 text-center mb-4">לחץ על המוצרים בתמונה לקנייה</p>
              
              <div className="relative">
                <img src={afterImg} alt="אחרי" className="w-full rounded-xl" />
                
                {/* Product Hotspots - dynamic per room */}
                {shopItems.map((item, index) => (
                  <ShopHotspot key={index} x={item.x} y={item.y} title={item.title} price={item.price} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ShopHotspot({ x, y, title, price }: { x: number; y: number; title: string; price: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div 
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-125 transition-transform cursor-pointer border-2 border-emerald-500 animate-pulse"
      >
        <span className="text-xs font-bold text-emerald-600">+</span>
      </button>
      
      {isOpen && (
        <div className="absolute top-8 right-0 bg-white rounded-xl shadow-xl p-3 min-w-[160px] z-10 border border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
          <p className="text-sm text-emerald-600 font-bold mb-2">{price}</p>
          <a 
            href={`https://www.google.com/search?q=${encodeURIComponent(title + ' לקנות בישראל')}&tbm=shop`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            חפש בגוגל שופינג ←
          </a>
        </div>
      )}
    </div>
  );
}

function ExampleCardComponent({ example }: { example: ExampleCard }) {
  const [showDetails, setShowDetails] = useState(false);
  const showShopFeature = example.id === 1 || example.id === 2 || example.id === 3; // Enable Shop the Look for all rooms

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300">
      <BeforeAfterSlider beforeImg={example.beforeImg} afterImg={example.afterImg} showShopLook={showShopFeature} shopItems={example.shopItems} />
      
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{example.title}</h3>
        <p className="text-sm text-gray-500 mb-4">{example.changes}</p>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-900 hover:text-gray-600 font-medium"
        >
          {showDetails ? "הסתר פירוט עלויות ↑" : "הצג פירוט עלויות ↓"}
        </button>
        
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
            <div className="space-y-2">
              {example.costs.map((cost, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600">{cost.item}</span>
                  <span className="text-gray-900">₪{cost.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 pt-3 border-t border-gray-100 font-semibold">
              <span className="text-gray-900">סה״כ משוער</span>
              <span className="text-gray-900">₪{example.total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VisualizePage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false); // Main subscription
  const [showPaywall, setShowPaywall] = useState(false);
  const [showTrialSuccess, setShowTrialSuccess] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{image: string, analysis: string, costs: any} | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [countdown, setCountdown] = useState(45);
  const [currentTip, setCurrentTip] = useState(0);
  const [showShopModal, setShowShopModal] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState<{id: string, name: string, position: {top: number, left: number}, searchQuery: string}[]>([]);
  const [detectingProducts, setDetectingProducts] = useState(false);
  const [visualizationHistory, setVisualizationHistory] = useState<{id: string, beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, createdAt: string}[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{id: string, beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, createdAt: string} | null>(null);
  
  const LOADING_TIPS = [
    "💡 קבל לפחות 3 הצעות מחיר לפני שמתחילים",
    "📋 תעד הכל בכתב - זה יחסוך לך כאבי ראש",
    "🔍 בדוק המלצות על קבלנים לפני שסוגרים",
    "💰 השאר 15% מהתקציב לבלת\"מים",
    "📅 שיפוץ תמיד לוקח יותר זמן מהצפוי",
    "🏠 צלם את המצב הקיים לפני שמתחילים",
    "⚡️ החשמל והאינסטלציה - לא חוסכים עליהם",
    "🎨 בחר צבעים ניטרליים - קל לשנות אחר כך",
    "📦 הזמן חומרים מראש - יש עיכובים באספקה",
    "✅ בדוק שהקבלן מבוטח ורשום"
  ];
  
  // Countdown and tips rotation when generating
  useEffect(() => {
    if (!generating) {
      setCountdown(45);
      setCurrentTip(0);
      return;
    }
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    const tipInterval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % LOADING_TIPS.length);
    }, 3000);
    
    return () => {
      clearInterval(countdownInterval);
      clearInterval(tipInterval);
    };
  }, [generating]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        let userEmail = "";
        let currentUserId = "";
        
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) {
            setIsLoggedIn(true);
            setUserId(user.id);
            userEmail = user.email;
            currentUserId = user.id;
            setHasPurchased(user.purchased === true);
          }
        } else {
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            setUserId(session.user.id);
            userEmail = session.user.email || "";
            currentUserId = session.user.id;
            // Check purchased from localStorage
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            setHasPurchased(storedUser.purchased === true);
          }
        }
        
        // Check if user should have trial reset (from admin panel)
        if (userEmail && currentUserId) {
          try {
            const res = await fetch(`/api/admin/trial-reset?email=${encodeURIComponent(userEmail)}`);
            const data = await res.json();
            if (data.shouldReset) {
              // Clear trial data - user gets a new trial!
              localStorage.removeItem(`visualize_trial_${currentUserId}`);
              console.log("Trial reset for user:", userEmail);
            }
          } catch (e) {
            console.error("Failed to check trial reset:", e);
          }
          
          // Check premium status from server
          try {
            const premRes = await fetch(`/api/admin/premium?email=${encodeURIComponent(userEmail)}`);
            const premData = await premRes.json();
            if (premData.hasPremium) {
              localStorage.setItem(`visualize_subscription_${currentUserId}`, 'active');
            }
          } catch (e) {
            console.error("Failed to check premium:", e);
          }
        }
        
        // Now check local trial & subscription status
        if (currentUserId) {
          const trialKey = `visualize_trial_${currentUserId}`;
          const subKey = `visualize_subscription_${currentUserId}`;
          setTrialUsed(localStorage.getItem(trialKey) === 'used');
          setHasSubscription(localStorage.getItem(subKey) === 'active');
        }
      } catch {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
        setHasPurchased(user.purchased === true);
        if (user.id) {
          setUserId(user.id);
          const trialKey = `visualize_trial_${user.id}`;
          setTrialUsed(localStorage.getItem(trialKey) === 'used');
          const subKey = `visualize_subscription_${user.id}`;
          setHasSubscription(localStorage.getItem(subKey) === 'active');
        }
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Load visualization history from localStorage
  useEffect(() => {
    if (userId) {
      const historyKey = `visualize_history_${userId}`;
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        try {
          setVisualizationHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error("Failed to load history:", e);
        }
      }
    }
  }, [userId]);

  // Save visualization to history
  const saveToHistory = (beforeImage: string, afterImage: string, description: string, analysis: string, costs: any) => {
    if (!userId) return;
    
    const newItem = {
      id: Date.now().toString(),
      beforeImage,
      afterImage,
      description,
      analysis,
      costs,
      createdAt: new Date().toISOString()
    };
    
    const historyKey = `visualize_history_${userId}`;
    const updatedHistory = [newItem, ...visualizationHistory].slice(0, 50); // Keep max 50 items
    setVisualizationHistory(updatedHistory);
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
  };

  const handleTryNow = () => {
    if (!isLoggedIn) {
      window.location.href = '/login?redirect=/visualize';
      return;
    }
    
    if (trialUsed && !hasSubscription) {
      setShowPaywall(true);
      return;
    }
    
    // Show upload modal for trial or subscription users
    setShowUploadModal(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !description) return;
    
    setGenerating(true);
    setGenerateError("");
    
    try {
      const res = await fetch('/api/visualize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: uploadedImage, description })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setGenerateError(data.error);
      } else {
        // Consume trial if not subscribed
        if (!hasSubscription && userId) {
          const trialKey = `visualize_trial_${userId}`;
          localStorage.setItem(trialKey, 'used');
          setTrialUsed(true);
        }
        
        setGeneratedResult({
          image: data.generatedImage,
          analysis: data.analysis,
          costs: data.costEstimate
        });
        
        // Save to history
        if (uploadedImage && data.generatedImage) {
          saveToHistory(uploadedImage, data.generatedImage, description, data.analysis, data.costEstimate);
        }
      }
    } catch (err) {
      setGenerateError("שגיאה בחיבור לשרת");
    }
    
    setGenerating(false);
  };

  const handleShopTheLook = async () => {
    if (!generatedResult?.image) return;
    
    setShowShopModal(true);
    setDetectingProducts(true);
    
    try {
      const res = await fetch('/api/detect-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: generatedResult.image })
      });
      
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setDetectedProducts(data.items);
      }
    } catch (err) {
      console.error("Failed to detect products:", err);
    }
    
    setDetectingProducts(false);
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/tips" className="text-xs text-gray-500 hover:text-gray-900">
              מאמרים וטיפים
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-gray-900 hover:text-gray-600">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-gray-900 hover:text-gray-600">
                התחברות
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center bg-gray-100 px-4 py-2 rounded-full mb-6">
            <span className="text-sm font-medium text-gray-700">חדש! ראה איך השיפוץ שלך יראה</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6 text-gray-900">
            ראה את השיפוץ<br />
            <span className="text-gray-900">לפני שמתחיל.</span>
          </h1>
          
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8 leading-relaxed">
            העלו תמונה של החדר, תאר מה אתה רוצה לשנות, וה-AI ייצור לך תמונה של התוצאה הסופית עם הערכת עלויות מדויקת.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 mb-8">
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> תמונה תוך שניות
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> הערכת עלויות מדויקת
            </span>
            <span className="flex items-center gap-1">
              <span className="text-green-500">✓</span> מבוסס מחירי שוק
            </span>
          </div>
          
          {/* Trial CTA */}
          <div className="flex flex-col items-center gap-3">
            {authLoading ? (
              <div className="bg-gray-200 text-gray-200 px-10 py-4 rounded-full text-lg font-medium animate-pulse">
                טוען...
              </div>
            ) : (
              <>
                <button
                  onClick={handleTryNow}
                  className="bg-gray-900 text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  {hasSubscription ? '🎨 צור הדמיה' : trialUsed ? '🔓 שדרג לגישה מלאה' : '✨ נסו עכשיו בחינם'}
                </button>
                {!hasSubscription && !trialUsed && (
                  <p className="text-sm text-gray-400">ניסיון אחד חינם · ללא כרטיס אשראי</p>
                )}
                {!hasSubscription && trialUsed && (
                  <p className="text-sm text-amber-600">השתמשת בניסיון החינמי</p>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* History Section - Only show if logged in and has history */}
      {isLoggedIn && visualizationHistory.length > 0 && (
        <section className="py-16 px-6 border-b border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
                🕐 ההדמיות שלי
              </h2>
              <p className="text-gray-500">{visualizationHistory.length} הדמיות נשמרו</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {visualizationHistory.slice(0, 6).map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 hover:shadow-xl transition-all cursor-pointer active:scale-95"
                  onClick={() => { console.log('History item clicked:', item.id); setSelectedHistoryItem(item); }}
                >
                  <div className="grid grid-cols-2 gap-1 p-2">
                    <div className="relative aspect-square">
                      <img src={item.beforeImage} alt="לפני" className="w-full h-full object-cover rounded-lg" />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">לפני</span>
                    </div>
                    <div className="relative aspect-square">
                      <img src={item.afterImage} alt="אחרי" className="w-full h-full object-cover rounded-lg" />
                      <span className="absolute bottom-1 right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded">אחרי</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-900 font-medium truncate">{item.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString('he-IL')}
                      </span>
                      {item.costs?.total && (
                        <span className="text-xs text-green-600 font-medium">
                          ₪{item.costs.total.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedHistoryItem(item); }}
                      className="w-full mt-3 bg-gray-900 text-white text-xs py-2 rounded-full hover:bg-gray-800 transition-colors"
                    >
                      📋 ראה פירוט עלויות
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {visualizationHistory.length > 6 && (
              <p className="text-center text-sm text-gray-400 mt-6">
                מציג 6 מתוך {visualizationHistory.length} הדמיות
              </p>
            )}
          </div>
        </section>
      )}

      {/* Examples Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              ראה איך זה עובד
            </h2>
            <p className="text-gray-500">דוגמאות אמיתיות של חדרים שעברו הדמיה</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {EXAMPLES.map((example) => (
              <ExampleCardComponent key={example.id} example={example} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              איך זה עובד?
            </h2>
          </div>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-gray-900">1</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">צלם את החדר</h3>
                <p className="text-gray-500">העלו תמונה של החדר שאתה רוצה לשפץ. עובד עם כל חדר - סלון, מטבח, חדר שינה, חדר רחצה.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-gray-900">2</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">תאר את השינויים</h3>
                <p className="text-gray-500">&quot;רוצה פרקט במקום אריחים, תאורה שקועה, וצבע אפור-כחול&quot; - פשוט ככה.</p>
              </div>
            </div>
            
            <div className="flex gap-6 items-start">
              <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-semibold text-white">3</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">קבל הדמיה + עלויות</h3>
                <p className="text-gray-500">תוך שניות תקבל תמונה של התוצאה הסופית, עם פירוט מדויק של העלויות הצפויות.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Show only if has main subscription but not vision */}
      {hasPurchased && !hasSubscription && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                רוצה לנסות בעצמך?
              </h2>
              <p className="text-gray-500">הוסף את שירות ההדמיה לחשבון שלך</p>
            </div>
            
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 relative overflow-hidden">
              {/* Premium badge */}
              <div className="absolute top-4 left-4 bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full">
                Premium
              </div>
              
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-4">
                  <img src="/icons/palette.png" alt="" className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">איך השיפוץ שלי יראה?</h3>
                <p className="text-sm text-gray-500">תוסף לחשבון ShiputzAI קיים</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900">₪39.99</div>
                <p className="text-gray-500">לחודש</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">10 הדמיות ביום</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">הערכת עלויות AI מדויקת</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">שמירת היסטוריית הדמיות</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">השוואה לפני/אחרי</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-700">שיתוף עם קבלנים</span>
                </li>
              </ul>
              
              <Link
                href="https://whop.com/checkout/plan_hp3ThM2ndloYF"
                className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
              >
                התחילו עכשיו
              </Link>
              
              <p className="text-center text-xs text-gray-400 mt-4">
                ביטול בכל עת
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Upsell to main subscription - show if logged in without main subscription */}
      {isLoggedIn && !hasPurchased && !hasSubscription && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="text-4xl mb-4">🔒</div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                שירות ההדמיה דורש מנוי ShiputzAI
              </h2>
              <p className="text-gray-500 mb-6">
                כדי להשתמש בשירות ההדמיה החכם, צריך קודם חשבון ShiputzAI פעיל
              </p>
              <Link
                href="/checkout"
                className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
              >
                הצטרף ל-ShiputzAI · ₪149.99
              </Link>
              <p className="text-xs text-gray-400 mt-4">תשלום חד פעמי · גישה לכל הכלים</p>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              שאלות נפוצות
            </h2>
          </div>
          
          <div className="space-y-6">
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה מדויקת הערכת העלויות?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                ההערכות מבוססות על מחירי שוק מעודכנים ומדויקות ל-±15%. המערכת לוקחת בחשבון את סוג העבודה, חומרים, ואזור גיאוגרפי.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                כמה הדמיות אפשר ליצור?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                עם מנוי לשירות ההדמיה אפשר ליצור עד 10 הדמיות ביום. המכסה מתאפסת בחצות.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                איך משתפים את ההדמיה עם קבלן?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                כל הדמיה נשמרת אוטומטית בפרויקט שלך. אפשר לשתף באמצעות לינק ישיר או להוריד כ-PDF עם כל פירוט העלויות.
              </p>
            </details>
            
            <details className="group border border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
              <summary className="flex items-center justify-between cursor-pointer font-medium text-gray-900">
                האם זה עובד עם כל סוג של חדר?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">↓</span>
              </summary>
              <p className="mt-4 text-gray-500 text-sm leading-relaxed">
                כן! המערכת עובדת עם כל סוג חדר - סלון, מטבח, חדר שינה, חדר רחצה, מרפסת, ועוד. מומלץ לצלם תמונה ברורה עם תאורה טובה.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-white">
            {isLoggedIn ? 'מוכן ליצור הדמיה?' : 'מוכן לראות את השיפוץ שלך?'}
          </h2>
          <p className="text-gray-400 mb-8">
            {isLoggedIn ? 'לחץ על הכפתור למעלה והתחל ליצור הדמיות' : 'הצטרף לאלפי משפצים שכבר משתמשים בשירות ההדמיה'}
          </p>
          {!isLoggedIn && (
            <div className="flex gap-4 flex-wrap justify-center">
              <Link
                href="/checkout"
                className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
              >
                הצטרפו ל-ShiputzAI
              </Link>
              <Link
                href="/login"
                className="text-white px-8 py-4 rounded-full text-base border border-gray-700 hover:bg-gray-800 transition-colors"
              >
                יש לי כבר חשבון
              </Link>
            </div>
          )}
          {isLoggedIn && (
            <button
              onClick={handleTryNow}
              className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
            >
              ✨ צור הדמיה חדשה
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-gray-900">פרטיות</Link>
            <Link href="/" className="hover:text-gray-900">דף הבית</Link>
          </div>
        </div>
      </footer>

      {/* Trial Success Modal */}
      {showTrialSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center animate-bounce-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎉</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">מעולה!</h3>
            <p className="text-gray-600 mb-4">הניסיון החינמי שלך מופעל</p>
            <p className="text-sm text-gray-400">מעביר אותך להדמיה...</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div className="bg-green-500 h-full animate-progress-bar"></div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowPaywall(false)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            {hasPurchased ? (
              // User has main subscription - show Vision upgrade
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-lg">✦</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">הניסיון החינמי נגמר</h3>
                  <p className="text-gray-500 text-sm">שדרג כדי להמשיך ליצור הדמיות</p>
                </div>
                
                <div className="border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-900">מנוי Vision</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">חודשי</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold text-gray-900">₪39.99</span>
                    <span className="text-gray-400">/חודש</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">10 הדמיות ביום</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">הערכת עלויות מפורטת</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">שמירה ושיתוף עם קבלנים</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">ביטול בכל עת</span>
                  </li>
                </ul>
                
                <Link
                  href="https://whop.com/checkout/plan_hp3ThM2ndloYF"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
                >
                  שדרג עכשיו
                </Link>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  תשלום מאובטח · ביטול בלחיצה
                </p>
              </>
            ) : (
              // User doesn't have main subscription - redirect to main checkout
              <>
                <div className="text-center mb-8">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-lg">🔒</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">שירות ההדמיה דורש מנוי ShiputzAI</h3>
                  <p className="text-gray-500 text-sm">כדי להמשיך, צריך קודם חשבון ShiputzAI פעיל</p>
                </div>
                
                <div className="border border-gray-200 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-900">ShiputzAI</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">חד פעמי</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-semibold text-gray-900">₪149.99</span>
                  </div>
                </div>
                
                <Link
                  href="/checkout"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
                >
                  הצטרף ל-ShiputzAI
                </Link>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  תשלום חד פעמי · גישה לכל הכלים
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && !generatedResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6 overflow-auto">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full relative">
            <button
              onClick={() => { setShowUploadModal(false); setUploadedImage(null); setDescription(""); }}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {hasSubscription ? '🎨 צור הדמיה חדשה' : '✨ הניסיון החינמי שלך'}
              </h3>
              <p className="text-gray-500">העלו תמונה של החדר ותאר מה אתה רוצה לשנות</p>
            </div>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונת החדר (לפני)</label>
              {!uploadedImage ? (
                <label className="block cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-gray-400 transition-colors">
                    <div className="text-4xl mb-4">📸</div>
                    <p className="text-gray-600 font-medium">לחץ להעלאת תמונה</p>
                    <p className="text-gray-400 text-sm mt-2">JPG, PNG עד 10MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative">
                  <img src={uploadedImage} alt="לפני" className="w-full rounded-2xl max-h-64 object-cover" />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    ✕
                  </button>
                  <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">לפני</span>
                </div>
              )}
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">מה לשנות?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="למשל: רוצה פרקט במקום אריחים, קירות בגוון אפור, תאורה שקועה, וסגנון מודרני..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-900 resize-none h-24"
              />
            </div>
            
            {generateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {generateError}
              </div>
            )}
            
            {generating && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {countdown > 0 ? `עוד ${countdown} שניות...` : "לוקח קצת יותר זמן מהרגיל..."}
                </div>
                <div className="text-sm text-gray-600 min-h-[40px] flex items-center justify-center">
                  {LOADING_TIPS[currentTip]}
                </div>
              </div>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !description || generating}
              className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span>
                  יוצר הדמיה...
                </span>
              ) : (
                '🪄 צור הדמיה'
              )}
            </button>
            
            {!hasSubscription && (
              <p className="text-center text-xs text-gray-400 mt-4">
                זהו הניסיון החינמי היחיד שלך
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result Modal */}
      {generatedResult && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl p-6 max-w-5xl w-full relative max-h-[95vh] overflow-auto">
            <button
              onClick={() => { setGeneratedResult(null); setShowUploadModal(false); setUploadedImage(null); setDescription(""); }}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl z-10"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 ההדמיה שלך מוכנה!</h3>
            </div>
            
            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <img src={uploadedImage || ''} alt="לפני" className="w-full rounded-2xl" />
                <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-full">לפני</span>
              </div>
              <div 
                className="relative cursor-pointer group"
                onClick={handleShopTheLook}
              >
                <img src={generatedResult.image} alt="אחרי" className="w-full rounded-2xl group-hover:brightness-110 transition-all" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי ✨</span>
                <button className="absolute bottom-3 left-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-full flex items-center gap-1.5 shadow-lg transition-colors">
                  <span>🛒</span>
                  <span>Shop the Look</span>
                </button>
              </div>
            </div>
            
            {/* Analysis */}
            {generatedResult.analysis && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">📝 ניתוח מקצועי</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{generatedResult.analysis}</p>
              </div>
            )}
            
            {/* Cost Estimate */}
            {generatedResult.costs && generatedResult.costs.total > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">💰 הערכת עלויות</h4>
                <div className="space-y-2">
                  {generatedResult.costs.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description}</span>
                      <span className="font-medium">₪{item.total?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>סה״כ משוער</span>
                    <span className="text-green-600">₪{generatedResult.costs.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-4">
              <a
                href={generatedResult.image}
                download="shiputzai-visualization.png"
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-center font-medium hover:bg-gray-800 transition-all"
              >
                📥 הורד תמונה
              </a>
              {hasSubscription ? (
                <button
                  onClick={() => { setGeneratedResult(null); setUploadedImage(null); setDescription(""); }}
                  className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-full text-center font-medium hover:bg-gray-50 transition-all"
                >
                  🎨 צור הדמיה נוספת
                </button>
              ) : hasPurchased ? (
                <Link
                  href="https://whop.com/checkout/plan_hp3ThM2ndloYF"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-full text-center font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  ⭐ שדרג להדמיות נוספות
                </Link>
              ) : (
                <Link
                  href="/checkout"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-full text-center font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
                >
                  🔓 הצטרף ל-ShiputzAI
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shop the Look Modal */}
      {showShopModal && generatedResult && (
        <div 
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => { setShowShopModal(false); setDetectedProducts([]); }}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => { setShowShopModal(false); setDetectedProducts([]); }}
              className="absolute top-4 right-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100"
            >
              ✕
            </button>
            
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center flex items-center justify-center gap-2">
                🛒 Shop the Look
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">לחץ על המוצרים בתמונה לחיפוש בגוגל שופינג</p>
              
              <div className="relative">
                <img src={generatedResult.image} alt="אחרי" className="w-full rounded-xl" />
                
                {detectingProducts && (
                  <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin text-3xl mb-2">⏳</div>
                      <p>מזהה מוצרים...</p>
                    </div>
                  </div>
                )}
                
                {/* Product Hotspots */}
                {detectedProducts.map((product, index) => (
                  <div
                    key={product.id || index}
                    className="absolute"
                    style={{ left: `${product.position.left}%`, top: `${product.position.top}%` }}
                  >
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(product.searchQuery + ' לקנות בישראל')}&tbm=shop`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-125 transition-transform cursor-pointer border-2 border-emerald-500 animate-pulse">
                        <span className="text-xs font-bold text-emerald-600">+</span>
                      </div>
                      <div className="absolute top-8 right-0 bg-white rounded-xl shadow-xl p-3 min-w-[160px] z-10 border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                        <p className="text-sm font-medium text-gray-900 mb-2">{product.name}</p>
                        <span className="text-xs text-emerald-600 font-medium">חפש בגוגל שופינג ←</span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
              
              {!detectingProducts && detectedProducts.length === 0 && (
                <p className="text-center text-gray-500 text-sm mt-4">לא זוהו מוצרים בתמונה</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Item Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl p-6 max-w-5xl w-full relative max-h-[95vh] overflow-auto">
            <button
              onClick={() => setSelectedHistoryItem(null)}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 text-xl z-10"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">🕐 הדמיה מהיסטוריה</h3>
              <p className="text-sm text-gray-500">
                {new Date(selectedHistoryItem.createdAt).toLocaleDateString('he-IL', { 
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </p>
            </div>
            
            {/* Before/After Comparison */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="relative">
                <img src={selectedHistoryItem.beforeImage} alt="לפני" className="w-full rounded-2xl" />
                <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-full">לפני</span>
              </div>
              <div 
                className="relative cursor-pointer group"
                onClick={() => {
                  // Set the generated result to the history item so Shop the Look works
                  setGeneratedResult({ image: selectedHistoryItem.afterImage, analysis: selectedHistoryItem.analysis, costs: selectedHistoryItem.costs });
                  setShowShopModal(true);
                  setDetectingProducts(true);
                  fetch('/api/detect-products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: selectedHistoryItem.afterImage })
                  }).then(res => res.json()).then(data => {
                    if (data.items?.length > 0) setDetectedProducts(data.items);
                    setDetectingProducts(false);
                  }).catch(() => setDetectingProducts(false));
                }}
              >
                <img src={selectedHistoryItem.afterImage} alt="אחרי" className="w-full rounded-2xl group-hover:brightness-110 transition-all" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי ✨</span>
                <button className="absolute bottom-3 left-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-2 rounded-full flex items-center gap-1.5 shadow-lg transition-colors">
                  <span>🛒</span>
                  <span>Shop the Look</span>
                </button>
              </div>
            </div>
            
            {/* Description */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">📝 מה ביקשת</h4>
              <p className="text-gray-700 text-sm">{selectedHistoryItem.description}</p>
            </div>
            
            {/* Analysis */}
            {selectedHistoryItem.analysis && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">📋 ניתוח מקצועי</h4>
                <p className="text-gray-700 text-sm leading-relaxed">{selectedHistoryItem.analysis}</p>
              </div>
            )}
            
            {/* Cost Estimate */}
            {selectedHistoryItem.costs?.total > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">💰 הערכת עלויות</h4>
                <div className="space-y-2">
                  {selectedHistoryItem.costs.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.description}</span>
                      <span className="font-medium">₪{item.total?.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                    <span>סה״כ משוער</span>
                    <span className="text-green-600">₪{selectedHistoryItem.costs.total?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-4">
              <a
                href={selectedHistoryItem.afterImage}
                download="shiputzai-visualization.png"
                className="flex-1 bg-gray-900 text-white py-3 rounded-full text-center font-medium hover:bg-gray-800 transition-all"
              >
                📥 הורד תמונה
              </a>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-full text-center font-medium hover:bg-gray-50 transition-all"
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
