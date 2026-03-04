"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { saveVisualization, loadVisualizations, deleteVisualization, Visualization } from "@/lib/visualizations";
import PricingComparison from "@/components/PricingComparison";
const FlappyBirdGame = dynamic(() => import('@/components/FlappyBirdGame'), { ssr: false });

// Dynamic import for Lottie (client-side only)
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Popcorn waiting animation URL
const POPCORN_ANIMATION_URL = '/popcorn-waiting.json';

// Add keyframes for animations
const animationStyles = `
@keyframes bounce-in {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes bounce-subtle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}
.animate-bounce-subtle {
  animation: bounce-subtle 2s ease-in-out infinite;
}
@keyframes progress-bar {
  0% { width: 0%; }
  100% { width: 100%; }
}
@keyframes shop-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
}
@keyframes tap-ripple {
  0% { transform: scale(0.6); opacity: 0.6; }
  50% { transform: scale(1.8); opacity: 0; }
  100% { transform: scale(1.8); opacity: 0; }
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
}
.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}
.animate-progress-bar {
  animation: progress-bar 2s ease-in-out;
}
.animate-shop-pulse {
  animation: shop-pulse 2s ease-in-out infinite;
}
.shop-btn-ripple {
  position: relative;
  overflow: visible;
}
.shop-btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.4);
  animation: tap-ripple 2s ease-out infinite;
  pointer-events: none;
}
@keyframes slide-reveal {
  0% { clip-path: inset(0 100% 0 0); }
  50% { clip-path: inset(0 0 0 0); }
  100% { clip-path: inset(0 100% 0 0); }
}
@keyframes pulse-arrow {
  0%, 100% { opacity: 0.4; transform: translateX(0); }
  50% { opacity: 1; transform: translateX(-4px); }
}
@keyframes float-badge {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-slide-reveal {
  animation: slide-reveal 6s ease-in-out infinite;
}
.animate-pulse-arrow {
  animation: pulse-arrow 1.5s ease-in-out infinite;
}
.animate-float-badge {
  animation: float-badge 3s ease-in-out infinite;
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
            <img src="/icons/cart.png" alt="סמל עגלת קניות" className="w-5 h-5" />
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
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center flex items-center justify-center gap-2"><img src="/icons/cart.png" alt="סמל עגלת קניות" className="w-6 h-6" /> Shop the Look</h3>
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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false); // Main subscription
  const [guestUsed, setGuestUsed] = useState(false); // Guest trial (no login)
  const [showPaywall, setShowPaywall] = useState(false);
  const [showTrialSuccess, setShowTrialSuccess] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [description, setDescription] = useState("");
  const [generating, setGenerating] = useState(false);
  const [showGameLoading, setShowGameLoading] = useState(false); // keeps game visible after generation done
  const [selectedPlan, setSelectedPlan] = useState<'plus' | 'separate'>('plus');
  const [generatedResult, setGeneratedResult] = useState<{image: string, beforeImage: string, analysis: string, costs: any} | null>(null);
  const [generateError, setGenerateError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [currentTip, setCurrentTip] = useState(0);
  const [showShopModal, setShowShopModal] = useState(false);
  // Products cache: keyed by visualization ID — single source of truth
  const [productsCache, setProductsCache] = useState<Record<string, {id: string, name: string, position: {top: number, left: number}, searchQuery: string}[]>>({});
  const [currentVisualizationId, setCurrentVisualizationId] = useState<string | null>(null);
  const [detectingProducts, setDetectingProducts] = useState(false);
  
  // Get products for current visualization from cache
  const detectedProducts = currentVisualizationId ? (productsCache[currentVisualizationId] || []) : [];
  
  // Helper to set products for a specific visualization
  const setCachedProducts = (vizId: string, products: any[]) => {
    setProductsCache(prev => ({ ...prev, [vizId]: products }));
  };
  
  // Helper to clear current visualization context (when starting new image)
  const clearProductsCache = () => {
    setCurrentVisualizationId(null);
  };
  
  const [visualizationHistory, setVisualizationHistory] = useState<{id: string, beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, createdAt: string, detectedProducts?: any[]}[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{id: string, beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, createdAt: string, detectedProducts?: any[]} | null>(null);
  const [savingToCloud, setSavingToCloud] = useState(false);
  const [waitingAnimationData, setWaitingAnimationData] = useState<object | null>(null);
  
  // Load popcorn animation for waiting state
  useEffect(() => {
    fetch(POPCORN_ANIMATION_URL)
      .then(res => res.json())
      .then(data => setWaitingAnimationData(data))
      .catch(err => console.error('Failed to load waiting animation:', err));
  }, []);
  
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
  
  // Check guest trial status (localStorage + cookie)
  useEffect(() => {
    try {
      if (
        localStorage.getItem("shiputz_guest_trial") === "true" ||
        document.cookie.includes("shiputz_guest_trial=true")
      ) {
        setGuestUsed(true);
      }
    } catch {}
  }, []);

  // Countdown and tips rotation when generating
  useEffect(() => {
    if (!generating) {
      setCountdown(60);
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
            setUserEmail(user.email);
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
            setUserEmail(session.user.email || null);
            userEmail = session.user.email || "";
            currentUserId = session.user.id;
            // Session exists but localStorage is empty - save user data!
            localStorage.setItem("user", JSON.stringify({
              id: session.user.id,
              email: session.user.email || "",
              name: session.user.user_metadata?.name || "",
              purchased: false
            }));
            setHasPurchased(false);
          }
        }
        
        // Check if user should have trial reset (from admin panel)
        if (userEmail) {
          try {
            const res = await fetch(`/api/admin/trial-reset?email=${encodeURIComponent(userEmail)}`);
            const data = await res.json();
            if (data.shouldReset) {
              // Trial reset triggered from admin - DB already updated
              setTrialUsed(false);
              console.log("Trial reset for user:", userEmail);
            }
          } catch (e) {
            console.error("Failed to check trial reset:", e);
          }
          
          // Check if user has the main ShiputzAI subscription (purchased) and Vision subscription
          try {
            const premRes = await fetch(`/api/admin/premium?email=${encodeURIComponent(userEmail)}`);
            const premData = await premRes.json();
            if (premData.hasPremium) {
              // User has main premium - update localStorage ONLY if we have valid user data
              const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
              if (storedUser.id) {
                localStorage.setItem("user", JSON.stringify({ ...storedUser, purchased: true }));
              }
              setHasPurchased(true);
            }
            // Check Vision subscription from database
            if (premData.hasVision) {
              setHasSubscription(true);
            }
          } catch (e) {
            console.error("Failed to check premium:", e);
          }
        }
        
        // Check trial status from database
        if (userEmail) {
          try {
            const trialRes = await fetch(`/api/vision-trial?email=${encodeURIComponent(userEmail)}`);
            if (trialRes.ok) {
              const trialData = await trialRes.json();
              setTrialUsed(trialData.trialUsed || false);
            }
          } catch (e) {
            console.error("Failed to check trial:", e);
          }
        }
      } catch {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
        setUserEmail(user.email || null);
        setHasPurchased(user.purchased === true);
        if (user.id) {
          setUserId(user.id);
          // Trial and subscription are checked from DB, this is fallback
        }
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Load visualization history from Supabase
  const reloadHistory = async (forUserId?: string) => {
    const effectiveUserId = forUserId || userId;
    if (!effectiveUserId) return;
    
    try {
      const data = await loadVisualizations(effectiveUserId);
      // Map Supabase format to local format
      const mapped = data.map(v => ({
        id: v.id,
        beforeImage: v.before_image_url,
        afterImage: v.after_image_url,
        description: v.description,
        analysis: v.analysis,
        costs: v.costs,
        createdAt: v.created_at,
        detectedProducts: v.detected_products || []
      }));
      setVisualizationHistory(mapped);
      
      // Populate products cache from DB data
      const newCache: Record<string, any[]> = {};
      mapped.forEach(v => {
        if (v.detectedProducts && v.detectedProducts.length > 0) {
          newCache[v.id] = v.detectedProducts;
        }
      });
      setProductsCache(prev => ({ ...prev, ...newCache }));
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  };
  
  useEffect(() => {
    if (userId) {
      reloadHistory(userId);
    }
  }, [userId]);

  // Save visualization to Supabase
  const saveToHistory = async (beforeImage: string, afterImage: string, description: string, analysis: string, costs: any, currentUserId?: string): Promise<string | null> => {
    // Use passed userId or fallback to state, then to localStorage
    const effectiveUserId = currentUserId || userId || JSON.parse(localStorage.getItem("user") || "{}").id;
    
    if (!effectiveUserId) {
      console.error("saveToHistory: No userId available", { currentUserId, userId, localStorage: localStorage.getItem("user") });
      return null;
    }
    
    console.log("saveToHistory: Saving with userId:", effectiveUserId);
    
    setSavingToCloud(true);
    try {
      const saved = await saveVisualization(effectiveUserId, beforeImage, afterImage, description, analysis, costs);
      if (saved) {
        console.log("saveToHistory: Save successful!", saved.id);
        // Store the visualization ID for product saving
        setCurrentVisualizationId(saved.id);
        // Add to local state
        const newItem = {
          id: saved.id,
          beforeImage: saved.before_image_url,
          afterImage: saved.after_image_url,
          description: saved.description,
          analysis: saved.analysis,
          costs: saved.costs,
          createdAt: saved.created_at
        };
        setVisualizationHistory(prev => [newItem, ...prev].slice(0, 50));
        return saved.id;
      } else {
        console.error("saveToHistory: Save returned null");
        return null;
      }
    } catch (e) {
      console.error("Failed to save to cloud:", e);
      return null;
    } finally {
      setSavingToCloud(false);
    }
  };

  // Delete visualization from Supabase
  const deleteFromHistory = async (itemId: string) => {
    if (!userId) return;
    
    const success = await deleteVisualization(itemId, userId);
    if (success) {
      setVisualizationHistory(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const handleTryNow = () => {
    // Guest (not logged in): allow one free trial
    if (!isLoggedIn) {
      if (guestUsed) {
        // Already used guest trial — prompt signup
        setShowPaywall(true);
        return;
      }
      setShowUploadModal(true);
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
      processImageFile(file);
    }
  };

  const processImageFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setGenerateError('יש להעלות קובץ תמונה בלבד');
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setGenerateError('התמונה גדולה מדי. גודל מקסימלי: 10MB');
      return;
    }
    
    // Clear any previous errors
    setGenerateError('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !description) return;
    
    setGenerating(true);
    setShowGameLoading(true);
    setGenerateError("");
    
    try {
      // Guest mode: use guest API (no auth required)
      const isGuest = !isLoggedIn;
      const apiUrl = isGuest ? '/api/visualize-guest' : '/api/visualize';
      const apiBody = isGuest
        ? { image: uploadedImage, description }
        : { image: uploadedImage, description, userEmail };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody)
      });
      
      const data = await res.json();
      
      if (data.error) {
        setGenerateError(data.error);
      } else {
        const generatedImage = data.generatedImage;
        const analysis = data.analysis;
        const costs = isGuest ? data.costs : data.costEstimate;

        if (isGuest) {
          // Mark guest trial as used
          try { localStorage.setItem("shiputz_guest_trial", "true"); } catch {}
          setGuestUsed(true);
        } else {
          // Consume trial if not subscribed - save to DB
          if (!hasSubscription && userEmail) {
            try {
              await fetch('/api/vision-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
              });
              setTrialUsed(true);
            } catch (e) {
              console.error("Failed to mark trial as used:", e);
            }
          }
        }
        
        setGeneratedResult({
          image: generatedImage,
          beforeImage: uploadedImage || '',
          analysis: analysis,
          costs: costs
        });
        clearProductsCache(); // Clear products for new image
        
        // Save to history (only for logged-in users)
        if (!isGuest) {
          const currentUserId = userId || JSON.parse(localStorage.getItem("user") || "{}").id;
          if (uploadedImage && generatedImage && currentUserId) {
            console.log("handleGenerate: Calling saveToHistory with userId:", currentUserId);
            saveToHistory(uploadedImage, generatedImage, description, analysis, costs, currentUserId)
              .then(() => {
                setTimeout(() => reloadHistory(currentUserId), 1000);
              })
              .catch(e => console.error('Failed to save to history:', e));
          } else {
            console.error("handleGenerate: Cannot save - missing data", { 
              hasUploadedImage: !!uploadedImage, 
              hasGeneratedImage: !!generatedImage, 
              currentUserId 
            });
          }
        }
      }
    } catch (err) {
      setGenerateError("שגיאה בחיבור לשרת. ייתכן שיש אנשים בתמונה - נסה תמונה ללא אנשים.");
    }
    
    setGenerating(false);
  };

  const handleShopTheLook = async () => {
    if (!generatedResult?.image) return;
    
    setShowShopModal(true);
    
    // Products are derived from cache — if already there, nothing to do
    if (detectedProducts.length > 0) {
      return;
    }
    
    // No products in cache — scan and save
    if (!currentVisualizationId) return;
    setDetectingProducts(true);
    
    try {
      const userData = localStorage.getItem("user");
      const userEmailForProducts = userData ? JSON.parse(userData).email : null;
      
      const res = await fetch('/api/detect-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: generatedResult.image, userEmail: userEmailForProducts })
      });
      
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        // Single write to cache — this is the only place products live
        setCachedProducts(currentVisualizationId, data.items);
        
        // Persist to DB (fire and forget)
        fetch('/api/update-visualization-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visualizationId: currentVisualizationId, products: data.items, userId })
        }).catch(e => console.error('Failed to save products to DB:', e));
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
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">
              🎨 AI Vision
            </span>
            <Link href="/tips" className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all">
              מאמרים וטיפים
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-full transition-all">
                התחברות
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section - optimized for mobile ad traffic */}
      <section className="pt-20 pb-12 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-gray-900 leading-tight">
            העלה תמונה של החדר.<br />
            <span className="text-emerald-600">קבל הדמיית שיפוץ תוך 30 שניות.</span>
          </h1>
          
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6 leading-relaxed">
            AI שמראה לך איך השיפוץ יראה — עם הערכת עלויות מדויקת
          </p>

          {/* CTA FIRST on mobile - before the image */}
          <div className="flex flex-col items-center gap-3 mb-8">
            {authLoading ? (
              <div className="relative bg-gray-900/20 px-10 py-4 rounded-full text-lg font-medium overflow-hidden">
                <span className="text-transparent">נסו עכשיו בחינם</span>
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            ) : (
              <>
                <button
                  onClick={handleTryNow}
                  className="bg-gray-900 text-white px-10 py-5 rounded-full text-xl font-bold hover:bg-gray-800 transition-all shadow-xl hover:shadow-2xl hover:scale-105 animate-bounce-subtle"
                >
                  {isLoggedIn
                    ? (hasSubscription ? '🎨 צור הדמיה' : trialUsed ? '🎭 שדרג ב-₪19 בלבד' : 'נסו עכשיו בחינם →')
                    : (guestUsed ? 'הירשם בחינם — צור עוד הדמיות →' : 'נסו עכשיו בחינם →')
                  }
                </button>
                {!isLoggedIn && !guestUsed && (
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><span className="text-green-500">✓</span> בחינם</span>
                    <span className="flex items-center gap-1"><span className="text-green-500">✓</span> בלי הרשמה</span>
                    <span className="flex items-center gap-1"><span className="text-green-500">✓</span> תוך 30 שניות</span>
                  </div>
                )}
                {!isLoggedIn && guestUsed && (
                  <p className="text-sm text-amber-600">השתמשת בניסיון החינמי · <Link href="/signup?redirect=/visualize" className="underline">הירשם להדמיות נוספות</Link></p>
                )}
                {isLoggedIn && !hasSubscription && !trialUsed && (
                  <p className="text-sm text-gray-400">ניסיון אחד חינם · ללא כרטיס אשראי</p>
                )}
                {isLoggedIn && !hasSubscription && trialUsed && (
                  <p className="text-sm text-amber-600">השתמשת בניסיון החינמי</p>
                )}
              </>
            )}
          </div>

          {/* Before → After */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="text-base font-bold text-gray-400">לפני</span>
            <span className="animate-pulse-arrow text-xl text-emerald-500">←</span>
            <span className="text-base font-bold text-emerald-600">אחרי</span>
          </div>

          {/* Before/After Image - lazy loaded */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 mb-6">
            <div className="relative aspect-[4/3]">
              <img 
                src="/before-room.jpg" 
                alt="לפני השיפוץ"
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
              <div className="absolute inset-0 animate-slide-reveal">
                <img 
                  src="/after-room.jpg" 
                  alt="אחרי השיפוץ"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              
              {/* Labels */}
              <div className="absolute top-3 right-3 z-10">
                <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  לפני
                </span>
              </div>
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-float-badge">
                  אחרי
                </span>
              </div>
              
              {/* Center divider */}
              <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/70 z-10" />
            </div>
          </div>

          {/* Social proof */}
          <p className="text-sm text-gray-400 mb-2">127+ משתמשים כבר ניסו השבוע</p>
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
                  className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-400 hover:shadow-xl transition-all cursor-pointer active:scale-95"
                  onClick={() => setSelectedHistoryItem(item)}
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('למחוק את ההדמיה הזו?')) {
                        deleteFromHistory(item.id);
                      }
                    }}
                    className="absolute top-2 left-2 z-10 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors text-sm"
                    title="מחק הדמיה"
                  >
                    ✕
                  </button>
                  <div className="grid grid-cols-2 gap-1 p-2">
                    <div className="relative aspect-square bg-gray-100">
                      <img 
                        src={item.beforeImage} 
                        alt="לפני" 
                        className="w-full h-full object-cover rounded-lg" 
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">תמונה לא זמינה</div>';
                        }}
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">לפני</span>
                    </div>
                    <div className="relative aspect-square bg-gray-100">
                      <img 
                        src={item.afterImage} 
                        alt="אחרי" 
                        className="w-full h-full object-cover rounded-lg" 
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">תמונה לא זמינה</div>';
                        }}
                      />
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

      {/* Demo Video - moved below examples */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-4">
              ראה איך זה עובד בפועל
            </h2>
            <p className="text-gray-500">צפו בהדגמה קצרה של התהליך</p>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              preload="metadata"
              className="w-full cursor-pointer"
              poster="/demo-video-poster.jpg"
              onClick={(e) => {
                const video = e.currentTarget;
                if (video.paused) {
                  video.play();
                } else {
                  video.pause();
                }
              }}
            >
              <source src="/demo-video.mp4" type="video/mp4" />
            </video>
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

      {/* Pricing Section - Show if not subscribed to Pro */}
      {isLoggedIn && !hasSubscription && (
        <section className="py-20 px-6 bg-gray-50">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">
                רוצה להמשיך?
              </h2>
              <p className="text-gray-500">שדרג למנוי Pro כדי להמשיך</p>
            </div>
            
            <PricingComparison />
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
                עם מנוי לשירות ההדמיה אפשר ליצור עד 5 הדמיות AI בחודש. המכסה מתאפסת בתחילת כל חודש.
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
            
            {!isLoggedIn ? (
              // Guest who used trial — prompt signup
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎉</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">אהבת? יש עוד!</h3>
                  <p className="text-gray-500 text-sm">השתמשת בניסיון החינמי. הירשם בחינם וקבל גישה להדמיות נוספות, שמירת היסטוריה, הערכת עלויות ועוד.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <Link
                    href="/signup?redirect=/visualize"
                    className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
                  >
                    🎉 הירשם בחינם
                  </Link>
                  <Link
                    href="/login?redirect=/visualize"
                    className="block w-full text-center border border-gray-300 text-gray-700 py-4 rounded-full text-base font-medium hover:bg-gray-50 transition-all"
                  >
                    יש לי כבר חשבון
                  </Link>
                </div>
              </>
            ) : hasPurchased ? (
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
                    <span className="text-sm font-medium text-gray-900">🎭 מבצע פורים</span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-bold">33% הנחה</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl text-gray-400 line-through">₪29</span>
                    <span className="text-4xl font-semibold text-gray-900">₪19</span>
                    <span className="text-gray-400">/חודש ראשון</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">אח״כ ₪29/חודש · ביטול בכל רגע</p>
                </div>
                
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">5 הדמיות AI בחודש</span>
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
                    <span className="text-gray-700">כתב כמויות + ניתוח הצעות</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-gray-700">סריקת קבלות + מעקב תקציב</span>
                  </li>
                </ul>
                
                <Link
                  href="/checkout"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all"
                >
                  🎭 להתחיל ב-₪19 בלבד
                </Link>
                
                <p className="text-center text-xs text-gray-400 mt-4">
                  חודש ראשון ₪19, אח״כ ₪29/חודש
                </p>
              </>
            ) : (
              // User doesn't have Pro subscription - show upgrade
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-lg">✦</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">🎭 מבצע פורים!</h3>
                  <p className="text-gray-500 text-sm">חודש ראשון ב-33% הנחה</p>
                </div>
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl text-gray-400 line-through">₪29</span>
                    <span className="text-4xl font-semibold text-gray-900">₪19</span>
                    <span className="text-gray-400">/חודש ראשון</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">אח״כ ₪29/חודש · ביטול בכל רגע</p>
                </div>
                
                <ul className="space-y-3 mb-6 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">5 הדמיות AI בחודש</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">הערכות עלויות מפורטות</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">כתב כמויות + ניתוח הצעות</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-700">סריקת קבלות + מעקב תקציב</span>
                  </li>
                </ul>
                
                <Link
                  href="/checkout"
                  className="block w-full text-center bg-gray-900 text-white py-4 rounded-xl text-base font-medium hover:bg-gray-800 transition-all"
                >
                  🎭 להתחיל ב-₪19 בלבד
                </Link>
                <p className="text-center text-xs text-gray-400 mt-3">חודש ראשון ₪19, אח״כ ₪29/חודש</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (!generatedResult || showGameLoading) && (
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
                {!isLoggedIn ? '✨ נסו בחינם — הדמיה אחת עלינו!' : hasSubscription ? '🎨 צור הדמיה חדשה' : '✨ הניסיון החינמי שלך'}
              </h3>
              <p className="text-gray-500">העלו תמונה של החדר ותאר מה אתה רוצה לשנות</p>
              <p className="text-amber-600 text-sm mt-1">💡 טיפ: העלו תמונה ללא אנשים לתוצאות טובות יותר</p>
            </div>
            
            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">תמונת החדר (לפני)</label>
              {!uploadedImage ? (
                <label 
                  className="block cursor-pointer"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  data-testid="image-upload-label"
                >
                  <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                    isDragOver 
                      ? 'border-green-500 bg-green-50 scale-[1.02]' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}>
                    <div className="text-4xl mb-4">{isDragOver ? '📥' : '📸'}</div>
                    <p className="text-gray-600 font-medium">
                      {isDragOver ? 'שחרר כאן!' : 'לחץ או גרור תמונה לכאן'}
                    </p>
                    <p className="text-gray-400 text-sm mt-2">ללא אנשים בתמונה</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="image-upload-input"
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
                data-testid="description-input"
              />
            </div>
            
            {generateError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {generateError}
              </div>
            )}
            
            {showGameLoading && (
              <div className="mb-4 p-4 bg-gray-50 rounded-xl text-center">
                {/* Flappy Bird mini-game during loading */}
                <FlappyBirdGame 
                  isReady={!!generatedResult} 
                  onShowResult={() => setShowGameLoading(false)} 
                />
                {generating && (
                  <>
                    <div className="text-2xl font-bold text-gray-900 mb-2">
                      {countdown > 0 ? `עוד ${countdown} שניות...` : "לוקח קצת יותר זמן מהרגיל..."}
                    </div>
                    <div className="text-sm text-gray-600 min-h-[40px] flex items-center justify-center">
                      💡 {LOADING_TIPS[currentTip]}
                    </div>
                  </>
                )}
              </div>
            )}
            
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !description || generating}
              className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="generate-button"
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
            
            {!hasSubscription && !trialUsed && (
              <p className="text-center text-xs text-gray-400 mt-4">
                זהו הניסיון החינמי היחיד שלך
              </p>
            )}
          </div>
        </div>
      )}

      {/* Result Modal */}
      {generatedResult && !showGameLoading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl p-6 max-w-5xl w-full relative max-h-[95vh] overflow-auto">
            <button
              onClick={() => { setGeneratedResult(null); setShowUploadModal(false); setUploadedImage(null); setDescription(""); clearProductsCache(); }}
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
                {(generatedResult.beforeImage || uploadedImage) ? (
                  <>
                    <img src={generatedResult.beforeImage || uploadedImage || ''} alt="לפני" className="w-full rounded-2xl" />
                    <span className="absolute top-3 right-3 bg-gray-900 text-white text-sm px-3 py-1 rounded-full">לפני</span>
                  </>
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-2xl flex items-center justify-center">
                    <span className="text-gray-400">🖼️ תמונת לפני</span>
                  </div>
                )}
              </div>
              <div 
                className="relative cursor-pointer group"
                onClick={handleShopTheLook}
              >
                <img src={generatedResult.image} alt="אחרי" className="w-full rounded-2xl group-hover:brightness-110 transition-all" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי ✨</span>
                <button className="absolute bottom-3 left-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg transition-colors animate-shop-pulse shop-btn-ripple">
                  <span>🛒</span>
                  <span>Shop the Look</span>
                </button>
              </div>
            </div>
            
            {/* Analysis */}
            {generatedResult.analysis && (
              <div className="bg-blue-50 rounded-2xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">📝 ניתוח מקצועי</h4>
                <div className="text-gray-700 text-sm leading-relaxed space-y-3">
                  {generatedResult.analysis.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph.replace(/\*\*/g, '').replace(/\n/g, ' ').trim()}</p>
                  ))}
                </div>
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
              <button
                onClick={() => {
                  const text = `תראו מה ShiputzAI עשה לי 😍 הדמיית שיפוץ ב-AI!\nhttps://shipazti.com/visualize`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 bg-[#25D366] text-white py-3 rounded-full text-center font-medium hover:bg-[#1fbd59] transition-all"
              >
                💬 שתף בוואטסאפ
              </button>
              {!isLoggedIn ? (
                <Link
                  href="/signup?redirect=/visualize"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white py-3 rounded-full text-center font-medium hover:from-emerald-600 hover:to-green-600 transition-all"
                >
                  🎉 הירשם בחינם — צור עוד הדמיות
                </Link>
              ) : hasSubscription ? (
                <button
                  onClick={() => { setGeneratedResult(null); setUploadedImage(null); setDescription(""); clearProductsCache(); }}
                  className="flex-1 border border-gray-300 text-gray-900 py-3 rounded-full text-center font-medium hover:bg-gray-50 transition-all"
                >
                  🎨 צור הדמיה נוספת
                </button>
              ) : hasPurchased ? (
                <Link
                  href="/checkout"
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
          onClick={() => setShowShopModal(false)}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowShopModal(false)}
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
                  setGeneratedResult({ image: selectedHistoryItem.afterImage, beforeImage: selectedHistoryItem.beforeImage, analysis: selectedHistoryItem.analysis, costs: selectedHistoryItem.costs });
                  setCurrentVisualizationId(selectedHistoryItem.id);
                  setShowShopModal(true);
                  
                  // Products come from cache automatically via currentVisualizationId
                  // If not in cache, scan and save
                  const vizId = selectedHistoryItem.id;
                  if (!productsCache[vizId] || productsCache[vizId].length === 0) {
                    setDetectingProducts(true);
                    const ud = localStorage.getItem("user");
                    const ue = ud ? JSON.parse(ud).email : null;
                    fetch('/api/detect-products', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ image: selectedHistoryItem.afterImage, userEmail: ue })
                    }).then(res => res.json()).then(data => {
                      if (data.items?.length > 0) {
                        // Single write to cache
                        setCachedProducts(vizId, data.items);
                        // Persist to DB (fire and forget)
                        fetch('/api/update-visualization-products', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ visualizationId: vizId, products: data.items, userId })
                        }).catch(e => console.error('Failed to save products:', e));
                      }
                      setDetectingProducts(false);
                    }).catch(() => setDetectingProducts(false));
                  }
                }}
              >
                <img src={selectedHistoryItem.afterImage} alt="אחרי" className="w-full rounded-2xl group-hover:brightness-110 transition-all" />
                <span className="absolute top-3 right-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full">אחרי ✨</span>
                <button className="absolute bottom-3 left-3 bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-full flex items-center gap-1.5 shadow-lg transition-colors animate-shop-pulse shop-btn-ripple">
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
                <div className="text-gray-700 text-sm leading-relaxed space-y-3">
                  {selectedHistoryItem.analysis.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph.replace(/\*\*/g, '').replace(/\n/g, ' ').trim()}</p>
                  ))}
                </div>
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
