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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showTrialSuccess, setShowTrialSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) {
            setIsLoggedIn(true);
            setUserId(user.id);
            // Check trial status
            const trialKey = `visualize_trial_${user.id}`;
            setTrialUsed(localStorage.getItem(trialKey) === 'used');
            // Check subscription status (stored when user subscribes)
            const subKey = `visualize_subscription_${user.id}`;
            setHasSubscription(localStorage.getItem(subKey) === 'active');
            return;
          }
        }
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          setUserId(session.user.id);
          // Check trial status
          const trialKey = `visualize_trial_${session.user.id}`;
          setTrialUsed(localStorage.getItem(trialKey) === 'used');
          // Check subscription
          const subKey = `visualize_subscription_${session.user.id}`;
          setHasSubscription(localStorage.getItem(subKey) === 'active');
        }
      } catch {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
        if (user.id) {
          setUserId(user.id);
          const trialKey = `visualize_trial_${user.id}`;
          setTrialUsed(localStorage.getItem(trialKey) === 'used');
          const subKey = `visualize_subscription_${user.id}`;
          setHasSubscription(localStorage.getItem(subKey) === 'active');
        }
      }
    };
    checkAuth();
  }, []);

  const handleTryNow = () => {
    if (!isLoggedIn) {
      // Redirect to login
      window.location.href = '/login?redirect=/visualize';
      return;
    }
    
    if (hasSubscription) {
      // Has subscription - go to shop-look
      window.location.href = '/shop-look';
      return;
    }
    
    if (trialUsed) {
      // Trial already used - show paywall
      setShowPaywall(true);
      return;
    }
    
    // Use trial
    if (userId) {
      const trialKey = `visualize_trial_${userId}`;
      localStorage.setItem(trialKey, 'used');
      setTrialUsed(true);
      setShowTrialSuccess(true);
      // After 2 seconds, redirect to shop-look
      setTimeout(() => {
        window.location.href = '/shop-look';
      }, 2000);
    }
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
            העלה תמונה של החדר, תאר מה אתה רוצה לשנות, וה-AI ייצור לך תמונה של התוצאה הסופית עם הערכת עלויות מדויקת.
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
            <button
              onClick={handleTryNow}
              className="bg-gray-900 text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              {hasSubscription ? '🎨 צור הדמיה' : trialUsed ? '🔓 שדרג לגישה מלאה' : '✨ נסה עכשיו בחינם'}
            </button>
            {!hasSubscription && !trialUsed && (
              <p className="text-sm text-gray-400">ניסיון אחד חינם · ללא כרטיס אשראי</p>
            )}
            {!hasSubscription && trialUsed && (
              <p className="text-sm text-amber-600">השתמשת בניסיון החינמי</p>
            )}
          </div>
        </div>
      </section>

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
                <p className="text-gray-500">העלה תמונה של החדר שאתה רוצה לשפץ. עובד עם כל חדר - סלון, מטבח, חדר שינה, חדר רחצה.</p>
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

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
              רוצה לנסות בעצמך?
            </h2>
            <p className="text-gray-500">הירשם לשירות ההדמיה</p>
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
              התחל עכשיו
            </Link>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              דורש חשבון ShiputzAI פעיל · ביטול בכל עת
            </p>
          </div>
        </div>
      </section>

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
            מוכן לראות את השיפוץ שלך?
          </h2>
          <p className="text-gray-400 mb-8">
            הצטרף לאלפי משפצים שכבר משתמשים בשירות ההדמיה
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="https://whop.com/checkout/plan_hp3ThM2ndloYF"
              className="bg-white text-gray-900 px-8 py-4 rounded-full text-base font-medium hover:bg-gray-100 transition-colors"
            >
              התחל עכשיו
            </Link>
            <Link
              href="/login"
              className="text-white px-8 py-4 rounded-full text-base border border-gray-700 hover:bg-gray-800 transition-colors"
            >
              יש לי כבר חשבון
            </Link>
          </div>
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
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">השתמשת בניסיון החינמי</h3>
              <p className="text-gray-500">אהבת את מה שראית? המשך ליצור הדמיות ללא הגבלה</p>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">מנוי חודשי</span>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">חסכון 30%</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-gray-900">₪39.99</span>
                <span className="text-gray-400">/חודש</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <span>10 הדמיות ביום</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <span>הערכת עלויות AI מדויקת</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <span>שמירה ושיתוף עם קבלנים</span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <span className="text-green-500">✓</span>
                <span>ביטול בכל עת</span>
              </li>
            </ul>
            
            <Link
              href="https://whop.com/checkout/plan_hp3ThM2ndloYF"
              className="block w-full text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-full text-base font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
            >
              🚀 שדרג עכשיו
            </Link>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              תשלום מאובטח · ביטול בלחיצה
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
