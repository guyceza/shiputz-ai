"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeroAnimation from "@/components/HeroAnimation";
import ComparisonSection from "@/components/ComparisonSection";
import PricingCard from "@/components/PricingCard";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [hasVisionSubscription, setHasVisionSubscription] = useState(false);
  
  useEffect(() => {
    // Check for auth session
    const checkAuth = async () => {
      try {
        // First check localStorage (faster)
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) {
            setIsLoggedIn(true);
            setIsAdmin(user.isAdmin === true);
            setIsPremium(user.purchased === true);
            // Check vision subscription
            const visionSub = localStorage.getItem(`visualize_subscription_${user.id}`);
            setHasVisionSubscription(visionSub === 'active');
            return;
          }
        }
        
        // Fallback to Supabase session
        const { getSession } = await import("@/lib/auth");
        const session = await getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          setIsAdmin(session.user.email === "guyceza@gmail.com");
          // Check premium status from localStorage user data
          const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
          setIsPremium(storedUser.purchased === true);
          // Check vision subscription
          if (storedUser.id) {
            const visionSub = localStorage.getItem(`visualize_subscription_${storedUser.id}`);
            setHasVisionSubscription(visionSub === 'active');
          }
        }
      } catch {
        // Fallback to localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
        setIsAdmin(user.isAdmin === true);
        setIsPremium(user.purchased === true);
        // Check vision subscription
        if (user.id) {
          const visionSub = localStorage.getItem(`visualize_subscription_${user.id}`);
          setHasVisionSubscription(visionSub === 'active');
        }
      }
    };
    checkAuth();
  }, []);
  
  const [calcSize, setCalcSize] = useState("80");
  const [calcType, setCalcType] = useState("קומפלט");
  const [calcLocation, setCalcLocation] = useState("מרכז");
  const [calcBathrooms, setCalcBathrooms] = useState("1");
  const [calcKitchen, setCalcKitchen] = useState("חדש");
  const [calcInfrastructure, setCalcInfrastructure] = useState("חלקי");
  const [estimate, setEstimate] = useState<number | null>(null);
  const [estimateBreakdown, setEstimateBreakdown] = useState<{base: number, bathrooms: number, kitchen: number, infrastructure: number} | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const calculateEstimate = () => {
    const size = parseInt(calcSize);
    const bathrooms = parseInt(calcBathrooms);
    
    // Base price per sqm by type (2026 market data - based on Midrag.co.il real transactions)
    // Midrag data: Full renovation 90 sqm = ₪120,000-190,000 (avg ₪1,333-2,111/sqm)
    const basePrices: Record<string, number> = {
      "קוסמטי": 550,    // ₪450-700/מ"ר - צביעה, תיקונים קטנים (Midrag: ריצוף ₪450-700/מ"ר)
      "קומפלט": 1700,   // ₪1,400-2,000/מ"ר - שיפוץ מלא (Midrag avg: ₪1,722/מ"ר)
      "יוקרתי": 3500,   // ₪3,000-4,000/מ"ר - חומרים וגימורים יוקרתיים
    };
    
    // Location multiplier
    const locationMultiplier: Record<string, number> = {
      "תל אביב": 1.25,
      "מרכז": 1.0,
      "שרון/שפלה": 0.95,
      "חיפה/צפון": 0.85,
      "דרום": 0.80,
    };
    
    // Kitchen prices (based on Midrag.co.il real transactions)
    // Midrag: חידוש מטבח ₪5,000-15,000, מטבח חדש ₪35,000-50,000, יוקרתי ₪70,000-100,000
    const kitchenPrices: Record<string, number> = {
      "ללא": 0,
      "רענון": 10000,   // חידוש דלתות/פרזול (Midrag: ₪5,000-15,000)
      "חדש": 45000,     // מטבח חדש איכותי (Midrag: ₪41,400-50,600)
      "יוקרתי": 85000,  // מטבח יוקרתי עם שיש קוריאן (Midrag: ₪70,000-100,000)
    };
    
    // Infrastructure prices (based on Midrag.co.il real transactions)
    // Midrag: אינסטלציה ₪18,670-22,820, חשמל ₪9,400-11,500
    const infraPrices: Record<string, number> = {
      "ללא": 0,
      "חלקי": 12000,    // חשמל או אינסטלציה חלקית (Midrag: ₪9,400-11,500)
      "מלא": 32000,     // חשמל + אינסטלציה מלאה (Midrag: ~₪28,000-34,000 combined)
    };
    
    // Bathroom price (per bathroom) - based on Midrag.co.il real transactions
    // Midrag: שיפוץ אמבטיה ₪16,000-32,000 (standard), ₪25,000-32,000 (high-end)
    const bathroomPrice = calcType === "יוקרתי" ? 28000 : calcType === "קומפלט" ? 22000 : 12000;
    
    const basePrice = basePrices[calcType] || 1400;
    const locMultiplier = locationMultiplier[calcLocation] || 1.0;
    
    const baseEstimate = Math.round(size * basePrice * locMultiplier);
    const bathroomEstimate = bathrooms * bathroomPrice;
    const kitchenEstimate = kitchenPrices[calcKitchen] || 0;
    const infraEstimate = infraPrices[calcInfrastructure] || 0;
    
    const total = baseEstimate + bathroomEstimate + kitchenEstimate + infraEstimate;
    
    setEstimate(total);
    setEstimateBreakdown({
      base: baseEstimate,
      bathrooms: bathroomEstimate,
      kitchen: kitchenEstimate,
      infrastructure: infraEstimate
    });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        if (res.ok) {
          setSubscribed(true);
          setEmail("");
        }
      } catch (error) {
        console.error("Newsletter subscription failed:", error);
      }
    }
  };

  return (
    <div className="min-h-screen">
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

      {/* Hero */}
      <section className="pt-11 min-h-screen flex flex-col justify-center px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-right">
              <p className="text-sm text-gray-500 mb-4">ניהול שיפוצים חכם</p>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4 text-gray-900">
                שיפוץ בשליטה מלאה.
              </h1>
              <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-8 leading-relaxed mx-auto lg:mx-0">
                בינה מלאכותית שמנהלת את התקציב, מנתחת הצעות מחיר, ומתריעה לפני שנכנסים לבעיה.
              </p>
              <div className="flex gap-4 flex-wrap justify-center lg:justify-start">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="bg-gray-900 text-white px-8 py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
                  >
                    לאזור האישי
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="bg-gray-900 text-white px-8 py-4 rounded-full text-base hover:bg-gray-800 hover-bounce hover-shine"
                  >
                    התחילו בחינם
                  </Link>
                )}
                <Link
                  href="#features"
                  className="text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-100 transition-colors"
                >
                  גלו עוד
                </Link>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-gray-400 mt-6">ללא כרטיס אשראי · התחל תוך דקה</p>
              )}
            </div>
            
            {/* Phone Animation */}
            <div className="flex-1 hidden lg:block">
              <HeroAnimation />
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-16 max-w-4xl mx-auto">
          <div className="group p-4 rounded-2xl hover-lift cursor-default">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">₪10,000,000<span className="text-gray-400">+</span></p>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">תקציבים הוזנו ב-24 שעות</p>
          </div>
          <div className="group p-4 rounded-2xl hover-lift cursor-default">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">100<span className="text-gray-400">+</span></p>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">משפצים פעילים</p>
          </div>
          <div className="group p-4 rounded-2xl hover-lift cursor-default">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">500<span className="text-gray-400">+</span></p>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">הצעות מחיר נותחו</p>
          </div>
          <div className="group p-4 rounded-2xl hover-lift cursor-default">
            <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 group-hover:scale-110 group-hover:text-emerald-600 transition-all duration-300">10,000<span className="text-gray-400">+</span></p>
            <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">טיפים נקראו</p>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 px-6 border-b border-gray-100">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes livePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
          }
          .live-dot {
            animation: livePulse 2s ease-in-out infinite;
          }
        `}} />
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="live-dot w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50"></span>
              מאובטח ופרטי
            </span>
            <span className="flex items-center gap-2">
              <span className="live-dot w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50" style={{ animationDelay: '0.3s' }}></span>
              ללא עלות לנסות
            </span>
            <span className="flex items-center gap-2">
              <span className="live-dot w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50" style={{ animationDelay: '0.6s' }}></span>
              מבוסס AI
            </span>
          </div>
        </div>
      </section>

      {/* Floating Pricing - Compact */}
      {!isPremium && (
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-6">
          <p className="text-gray-600 text-lg">מוכנים להתחיל לנהל את השיפוץ?</p>
          <PricingCard variant="mini" />
        </div>
      </section>
      )}

      {/* Quick Calculator */}
      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">כמה יעלה לך השיפוץ?</h2>
            <p className="text-gray-500">קבלו הערכה מיידית על בסיס נתוני שוק 2026</p>
          </div>
          
          <div className="relative">
            {/* Blur overlay with lock - hidden for admin */}
            {!isAdmin && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 rounded-3xl flex flex-col items-center justify-center">
                <div className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-sm mx-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">מחשבון עלויות מתקדם</h3>
                  <p className="text-gray-500 text-sm mb-6">שדרגו לחשבון פרימיום כדי לקבל הערכת עלויות מדויקת לשיפוץ שלכם</p>
                  <Link
                    href="/checkout"
                    className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    שדרג עכשיו
                  </Link>
                </div>
              </div>
            )}
            
          <div className="bg-gray-50 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">גודל הדירה (מ״ר)</label>
                <select 
                  value={calcSize}
                  onChange={(e) => setCalcSize(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="50">50 מ״ר</option>
                  <option value="60">60 מ״ר</option>
                  <option value="70">70 מ״ר</option>
                  <option value="80">80 מ״ר</option>
                  <option value="90">90 מ״ר</option>
                  <option value="100">100 מ״ר</option>
                  <option value="120">120 מ״ר</option>
                  <option value="150">150 מ״ר</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">סוג השיפוץ</label>
                <select 
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="קוסמטי">קוסמטי (צבע, תיקונים קלים)</option>
                  <option value="קומפלט">קומפלט (שינויים משמעותיים)</option>
                  <option value="יוקרתי">יוקרתי (גמר גבוה)</option>
                </select>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">מיקום</label>
                <select 
                  value={calcLocation}
                  onChange={(e) => setCalcLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="תל אביב">תל אביב (+25%)</option>
                  <option value="מרכז">מרכז (בסיס)</option>
                  <option value="שרון/שפלה">שרון / שפלה (-5%)</option>
                  <option value="חיפה/צפון">חיפה / צפון (-15%)</option>
                  <option value="דרום">דרום (-20%)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">חדרי רחצה</label>
                <select 
                  value={calcBathrooms}
                  onChange={(e) => setCalcBathrooms(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="1">1 חדר רחצה</option>
                  <option value="2">2 חדרי רחצה</option>
                  <option value="3">3 חדרי רחצה</option>
                </select>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-600 mb-2">מטבח</label>
                <select 
                  value={calcKitchen}
                  onChange={(e) => setCalcKitchen(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="ללא">ללא שינוי</option>
                  <option value="רענון">רענון (חזיתות, משטח)</option>
                  <option value="חדש">מטבח חדש סטנדרטי</option>
                  <option value="יוקרתי">מטבח יוקרתי</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-2">תשתיות (חשמל/אינסטלציה)</label>
                <select 
                  value={calcInfrastructure}
                  onChange={(e) => setCalcInfrastructure(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-gray-900 cursor-pointer"
                >
                  <option value="ללא">ללא שינוי</option>
                  <option value="חלקי">שדרוג חלקי</option>
                  <option value="מלא">החלפה מלאה</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={calculateEstimate}
              className="w-full bg-gray-900 text-white py-4 rounded-full text-base font-medium hover:bg-gray-800 hover-bounce hover-shine"
            >
              חשב עכשיו
            </button>
            
            {estimate && estimateBreakdown && (
              <div className="mt-8 animate-fadeIn">
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <p className="text-sm text-gray-500 mb-2 text-center">הערכת עלות משוערת</p>
                  <p className="text-4xl font-bold text-gray-900 mb-4 text-center">₪{estimate.toLocaleString()}</p>
                  
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <p className="text-xs text-gray-500 mb-2">פירוט:</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">עבודות בסיס ({calcSize} מ״ר)</span>
                        <span className="text-gray-900">₪{estimateBreakdown.base.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">חדרי רחצה ({calcBathrooms})</span>
                        <span className="text-gray-900">₪{estimateBreakdown.bathrooms.toLocaleString()}</span>
                      </div>
                      {estimateBreakdown.kitchen > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">מטבח</span>
                          <span className="text-gray-900">₪{estimateBreakdown.kitchen.toLocaleString()}</span>
                        </div>
                      )}
                      {estimateBreakdown.infrastructure > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">תשתיות</span>
                          <span className="text-gray-900">₪{estimateBreakdown.infrastructure.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2 text-center">⚠️ הערכה בלבד · מבוסס על נתוני שוק 2026 · לא מהווה הצעת מחיר</p>
                  <p className="text-xs text-gray-400 mb-6 text-center">מקורות: top-renovations.co.il, renovations-israel.co.il</p>
                  <Link
                    href={isLoggedIn ? "/dashboard" : "/signup"}
                    className="block text-center bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    {isLoggedIn ? "התחל לנהל את התקציב ←" : "רוצה לנהל את התקציב? התחל פרויקט ←"}
                  </Link>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </section>

      {/* איך השיפוץ שלי יראה? Teaser */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            {/* Preview - Real Before/After Images */}
            <div className="flex-1 relative">
              <div className="grid grid-cols-2 gap-3 rounded-2xl overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <img 
                    src="/before-room.jpg" 
                    alt="לפני השיפוץ"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-sm py-2 text-center">
                    לפני
                  </div>
                </div>
                <Link 
                  href="/shop-look"
                  className="relative aspect-[4/3] group cursor-pointer"
                >
                  <img 
                    src="/after-room.jpg" 
                    alt="אחרי השיפוץ"
                    className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white text-sm py-2 text-center">
                    אחרי
                  </div>
                  
                  {/* Product Hotspots - visual only, click goes to shop-look */}
                  <div className="absolute w-4 h-4 bg-white/90 rounded-full shadow-lg animate-pulse" style={{left: '15%', top: '40%'}} />
                  <div className="absolute w-4 h-4 bg-white/90 rounded-full shadow-lg animate-pulse" style={{left: '75%', top: '35%'}} />
                  <div className="absolute w-4 h-4 bg-white/90 rounded-full shadow-lg animate-pulse" style={{left: '45%', top: '20%'}} />
                  <div className="absolute w-4 h-4 bg-white/90 rounded-full shadow-lg animate-pulse" style={{left: '8%', top: '55%'}} />
                  
                  {/* Shop the Look badge */}
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <img src="/icons/cart.png" alt="" className="w-4 h-4" />
                    <span>לחצו לצפייה גדולה</span>
                  </div>
                </Link>
              </div>
              <div className="absolute -top-3 -right-3 bg-gray-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                חדש
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 text-center md:text-right">
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
                איך השיפוץ שלי יראה?
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                העלו תמונה של החדר, תארו מה אתם רוצים לשנות, וקבלו הדמיה של התוצאה הסופית עם הערכת עלויות.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8">
                <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-4 py-2">הדמיה חכמה</span>
                <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-4 py-2">הערכת עלויות</span>
                <span className="text-sm text-gray-600 border border-gray-200 rounded-full px-4 py-2">תוך שניות</span>
              </div>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Link
                  href="/visualize"
                  className="inline-block bg-gray-900 text-white px-8 py-4 rounded-full text-base hover:bg-gray-800 hover-bounce hover-shine"
                >
                  נסו עכשיו
                </Link>
                <Link
                  href="/shop-look"
                  className="inline-flex items-center gap-2 border border-gray-200 text-gray-900 px-6 py-4 rounded-full text-base hover:bg-gray-50 transition-colors"
                >
                  <img src="/icons/cart.png" alt="" className="w-5 h-5" />
                  <span>Shop the Look</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div>
              <p className="text-4xl font-semibold text-gray-900 mb-2">₪15B</p>
              <p className="text-gray-500">שוק השיפוצים בישראל</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-gray-900 mb-2">70%</p>
              <p className="text-gray-500">משיפוצים חורגים מהתקציב</p>
            </div>
            <div>
              <p className="text-4xl font-semibold text-gray-900 mb-2">3 מתוך 4</p>
              <p className="text-gray-500">מדווחים על בעיות עם קבלנים</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Comparison */}
      <ComparisonSection />

      {/* Testimonials */}
      <section className="py-24 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">מה אומרים המשפצים</h2>
            <p className="text-gray-500">הצטרפו למאות משפצים שכבר חוסכים זמן וכסף</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <TestimonialCard
              quote="שפצתי דירת 4 חדרים והאפליקציה עזרה לי לחסוך ₪15,000 בהשוואת הצעות מחיר"
              name="יעל מ."
              city="תל אביב"
              rating={5}
            />
            <TestimonialCard
              quote="סוף סוף הצלחתי לעקוב אחרי כל ההוצאות במקום אחד. ממליץ בחום!"
              name="אבי כ."
              city="רמת גן"
              rating={5}
            />
            <TestimonialCard
              quote="ניתוח הצעת המחיר ב-AI חשף לי עלויות מנופחות שחסכו לי אלפים"
              name="מיכל ר."
              city="חיפה"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* Tip of the Week */}
      <section className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 md:p-10 border border-amber-100">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">הטיפ השבוע</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                לפני שסוגרים עם קבלן, בקשו ממנו כתב כמויות מפורט - זה יחסוך לכם הפתעות בהמשך ויאפשר השוואה אמיתית בין הצעות.
              </p>
              <Link 
                href="/tips"
                className="text-sm font-medium text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 group"
              >
                עוד טיפים 
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">כל מה שצריך.</h2>
            <p className="text-gray-500 mt-4">ותו לא.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <Feature title="מעקב תקציב" description="ראו בדיוק כמה הוצאת, על מה, ומתי. התראות אוטומטיות כשמתקרבים לגבול." />
            <Feature title="סריקת קבלות" description="צלמו קבלה, ה-AI קורא ומוסיף לרשימה. סכום, תאריך, קטגוריה - אוטומטי." />
            <Feature title="ניתוח הצעות מחיר" description="העלו הצעה ותקבלו ניתוח מיידי. האם המחיר הוגן? מה חסר?" />
            <Feature title="בדיקת חוזים" description="ה-AI סורק את החוזה ומזהה סעיפים בעייתיים או חסרים." />
            <Feature title="התראות חכמות" description="חרגת מהתקציב? תשלום חריג? המערכת מתריעה בזמן." />
            <Feature title="עוזר AI" description="שאלו כל שאלה על השיפוץ וקבלו תשובה מקצועית ומותאמת." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">שלושה צעדים.</h2>
          </div>
          <div className="space-y-16">
            <Step number="01" title="הגדירו פרויקט" description="תנו שם, הגדירו תקציב, והתחילו. לוקח 30 שניות." />
            <Step number="02" title="תעדו הוצאות" description="צלמו קבלות, העלו מסמכים, סמנו תשלומים." />
            <Step number="03" title="קבלו שליטה" description="ראו את המצב בזמן אמת, קבלו התראות, קבלו החלטות." />
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 px-6 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">קבלו טיפים לשיפוץ חכם</h2>
          <p className="text-gray-500 mb-8">הצטרפו ל-500+ משפצים שמקבלים טיפים שבועיים</p>
          
          {subscribed ? (
            <div className="bg-green-50 text-green-700 rounded-2xl p-6 border border-green-100">
              <span className="text-2xl mb-2 block">✓</span>
              <p className="font-medium">נרשמת בהצלחה!</p>
              <p className="text-sm mt-1">הטיפ הראשון בדרך אליך</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-5 py-4 border border-gray-200 rounded-full text-base focus:outline-none focus:border-gray-900 text-left"
                dir="ltr"
                required
              />
              <button
                type="submit"
                className="bg-gray-900 text-white px-8 py-4 rounded-full text-base font-medium hover:bg-gray-800 hover-bounce hover-shine whitespace-nowrap"
              >
                הרשמה
              </button>
            </form>
          )}
          <p className="text-xs text-gray-400 mt-4">ללא ספאם. אפשר להסיר בכל עת.</p>
        </div>
      </section>

      {/* Pricing - hide for users with subscription */}
      {!isPremium && (
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-sm mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">פשוט.</h2>
          <p className="text-gray-500 mb-12">תשלום אחד. לכל משך הפרויקט.</p>
          
          <div className="border-2 border-gray-400 rounded-3xl p-10 relative overflow-hidden bg-white shadow-lg hover-scale hover-glow">
            {/* Discount Badge */}
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              50% הנחה
            </div>
            
            <div className="mb-2">
              <span className="text-2xl text-gray-400 line-through">₪299.99</span>
            </div>
            <div className="text-6xl font-semibold text-gray-900 mb-2">₪149.99</div>
            <p className="text-gray-500 mb-2">תשלום חד פעמי</p>
            <p className="text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-8">מבצע לזמן מוגבל</p>
            
            <ul className="text-right space-y-4 mb-10 text-sm text-gray-600">
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>מעקב תקציב ללא הגבלה</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>סריקת קבלות AI</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>ניתוח הצעות מחיר</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>בדיקת חוזים</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>התראות חכמות</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span>עוזר AI אישי</span>
              </li>
            </ul>
            <Link
              href="/checkout"
              className="block bg-gray-900 text-white py-4 rounded-full text-base hover:bg-gray-800 transition-colors"
            >
              לרכישה
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* About / Our Story */}
      <section className="py-24 px-6 border-t border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">מי אנחנו</h2>
          </div>
          
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100">
            <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed space-y-6 text-right">
              <p>
                <span className="text-gray-900 font-medium">שיפצתי דירה.</span> חשבתי שאני מוכן - אקסל מסודר, תיקייה עם הצעות מחיר, גוגל דרייב לקבלות.
              </p>
              <p>
                אחרי שבועיים האקסל היה מבולגן, הקבלות התפזרו בין הארנק לאפליקציית הבנק, ולא היה לי מושג כמה באמת הוצאתי.
              </p>
              <p>
                הגעתי לסוף השיפוץ עם חריגה של ₪20,000 - ולא הבנתי איפה הכסף הלך.
              </p>
              <p>
                <span className="text-gray-900 font-medium">בניתי את Shipazti כי רציתי כלי שהלוואי היה לי כשהתחלתי.</span> משהו פשוט שעושה את העבודה - מצלמים קבלה והיא נכנסת, מקבלים התראה לפני שחורגים, יודעים בכל רגע איפה עומדים.
              </p>
              <p className="text-gray-500 text-base">
                — גיא, מייסד Shipazti
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">שאלות ששאלתי את עצמי</h2>
            <p className="text-gray-500">לפני ששפצתי. אולי גם אתה שואל.</p>
          </div>
          
          <div className="space-y-6">
            <FaqItem 
              question="אני מרגיש שהקבלן מנפח לי את המחיר. איך אני בודק?"
              answer="גם אני הרגשתי ככה. בניתי את ShiputzAI בדיוק בגלל זה - העלה הצעת מחיר והמערכת תגיד לכם אם המחיר סביר לאזור שלכם, ומה בדרך כלל חסר בהצעות כאלה."
            />
            <FaqItem 
              question="התחלתי עם אקסל אבל אחרי שבוע כבר לא עדכנתי..."
              answer="קלאסי. לי קרה בדיוק אותו דבר. לכן פה את רק מצלמו קבלה והמערכת עושה את השאר - מזהה סכום, תאריך, קטגוריה, ומוסיפה לתקציב. אפס מאמץ."
            />
            <FaqItem 
              question="אני מפחד להגיע לסוף השיפוץ ולגלות שאין לי כסף"
              answer="הפחד הזה שמר אותי ער בלילות. המערכת מתריעה ברגע שמתקרבים לחריגה - לא בסוף כשכבר מאוחר, אלא באמצע כשעוד אפשר לעשות משהו."
            />
            <FaqItem 
              question="יש לי 3 הצעות מחיר ואני לא מצליח להשוות ביניהן"
              answer="כי כל קבלן כותב אחרת. אחד מפרט, אחד כולל הכל בשורה אחת, והשלישי שכח חצי מהדברים. ה-AI מנתח את ההצעות ומראה לכם בדיוק מה כל אחד כולל ומה חסר."
            />
            <FaqItem 
              question="זה לא יקר מדי לעוד אפליקציה?"
              answer="₪149 חד פעמי. אם זה חוסך לכם טעות אחת של ₪500 בהצעת מחיר - כבר הרווחת. ורוב המשתמשים שלנו חוסכים הרבה יותר."
            />
            <FaqItem 
              question="מה אם אני לא מבין בטכנולוגיה?"
              answer="אם אתם יודעים לצלם תמונה בטלפון, אתם יודעים להשתמש ב-ShiputzAI. רציני. זה פשוט."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gray-900 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">{isLoggedIn ? "הפרויקטים שלך מחכים" : "מוכנים?"}</h2>
          <p className="text-gray-400 mb-8">{isLoggedIn ? "חזור לאזור האישי ותמשיך מאיפה שהפסקת." : "התחילו לנהל את השיפוץ בצורה חכמה."}</p>
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-100 hover-bounce hover-shine"
          >
            {isLoggedIn ? "לאזור האישי" : "התחילו בחינם"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2026 ShiputzAI</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-900">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-gray-900">פרטיות</Link>
            <Link href="#" className="hover:text-gray-900">צור קשר</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover-lift hover-glow">
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-8 items-start">
      <span className="text-sm text-gray-400 font-medium">{number}</span>
      <div>
        <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, city, rating }: { quote: string; name: string; city: string; rating: number }) {
  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-100 hover-lift hover-glow">
      <div className="text-4xl text-gray-200 mb-4 leading-none">"</div>
      <p className="text-gray-700 mb-6 leading-relaxed">{quote}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">{city}</p>
        </div>
        <div className="flex gap-0.5">
          {Array.from({ length: rating }).map((_, i) => (
            <span key={i} className="text-amber-400">★</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 text-right flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="text-base font-medium text-gray-900">{question}</span>
        <span className={`text-2xl text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <p className="px-6 pb-5 text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// ProductHotspot component removed - was unused

