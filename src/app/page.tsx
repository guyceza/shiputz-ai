"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import HeroAnimation from "@/components/HeroAnimation";
import ComparisonSection from "@/components/ComparisonSection";
import PricingCard from "@/components/PricingCard";
import PricingComparison from "@/components/PricingComparison";
import StatsCounter from "@/components/StatsCounter";
import { isNewsletterDismissed, dismissNewsletter } from "@/lib/user-settings";

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
        let userEmail: string | null = null;
        
        if (userData) {
          const user = JSON.parse(userData);
          if (user.id) {
            setIsLoggedIn(true);
            setIsAdmin(user.isAdmin === true);
            setIsPremium(user.purchased === true);
            userEmail = user.email;
          }
        }
        
        // Fallback to Supabase session
        if (!userEmail) {
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            setIsAdmin(session.user.email === "guyceza@gmail.com");
            userEmail = session.user.email || null;
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            setIsPremium(storedUser.purchased === true);
          }
        }
        
        // Check premium & vision from database (most reliable)
        if (userEmail) {
          try {
            const res = await fetch(`/api/admin/premium?email=${encodeURIComponent(userEmail)}`);
            if (res.ok) {
              const data = await res.json();
              setIsPremium(data.hasPremium || false);
              setHasVisionSubscription(data.hasVision || false);
            }
          } catch (e) {
            console.error("Premium/Vision check failed:", e);
          }
        }
      } catch {
        // Fallback to localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setIsLoggedIn(!!user.id);
        setIsAdmin(user.isAdmin === true);
        setIsPremium(user.purchased === true);
      }
    };
    checkAuth();
  }, []);
  
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [showNewsletterPopup, setShowNewsletterPopup] = useState(false);
  
  // Show newsletter popup after 10 seconds (if not already dismissed)
  useEffect(() => {
    const checkNewsletter = async () => {
      // First check localStorage for quick response
      const localDismissed = localStorage.getItem('newsletter_popup_dismissed');
      if (localDismissed) return;
      
      // For logged in users, also check DB
      const userData = localStorage.getItem("user");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.id) {
          const dbDismissed = await isNewsletterDismissed(user.id);
          if (dbDismissed) {
            localStorage.setItem('newsletter_popup_dismissed', 'true'); // sync to local
            return;
          }
        }
      }
      
      // Show popup after delay
      setTimeout(() => {
        setShowNewsletterPopup(true);
      }, 10000);
    };
    
    checkNewsletter();
  }, []);

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
      <section className="pt-20 pb-8 px-6">
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
                    className="text-white px-8 py-4 rounded-full text-base hover:opacity-90 transition-colors"
                    style={{ backgroundColor: '#101010' }}
                  >
                    לאזור האישי
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="text-white px-8 py-4 rounded-full text-base hover:opacity-90 hover-bounce hover-shine"
                    style={{ backgroundColor: '#101010' }}
                  >
                    התחילו בחינם
                  </Link>
                )}
                <Link
                  href="#features"
                  className="text-gray-900 px-8 py-4 rounded-full text-base border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all"
                >
                  גלו עוד
                </Link>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-gray-500 mt-6">ללא כרטיס אשראי · התחל תוך דקה</p>
              )}
            </div>
            
            {/* Phone Animation */}
            <div className="flex-1 hidden lg:block">
              <HeroAnimation />
            </div>
          </div>
        </div>
        
        {/* Stats with counting animation */}
        <StatsCounter />
      </section>

      {/* Trust Bar */}
      <section className="py-4 px-6 border-b border-gray-100">
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

      {/* Trusted Sources Bar - Infinite Carousel */}
      <section className="py-8 bg-gray-50 border-y border-gray-100 overflow-hidden" dir="ltr">
        <style dangerouslySetInnerHTML={{ __html: `
          .brands-marquee {
            display: flex;
            width: max-content;
            animation: brands-scroll 25s linear infinite;
          }
          .brands-marquee .brand-item {
            padding: 0 1.5rem;
            white-space: nowrap;
          }
          @keyframes brands-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-25%); }
          }
        `}} />
        <p className="text-center text-sm text-gray-500 mb-5" dir="rtl">מחירונים מבוססים על נתונים מ:</p>
        <div className="brands-marquee">
          <span className="brand-item"><img src="/logos/ace.png" alt="ACE" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/homecenter.png" alt="הום סנטר" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/tambur.png" alt="טמבור" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/ikea.svg" alt="IKEA" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/foxhome.png" alt="FOX home" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/castro.png" alt="Castro HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/idesign.png" alt="iDesign" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/zara-home.svg" alt="ZARA HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/hm-home.svg" alt="H&M HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/midrag.png" alt="מידרג" className="h-8" /></span>
          <span className="brand-item"><img src="/logos/ace.png" alt="ACE" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/homecenter.png" alt="הום סנטר" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/tambur.png" alt="טמבור" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/ikea.svg" alt="IKEA" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/foxhome.png" alt="FOX home" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/castro.png" alt="Castro HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/idesign.png" alt="iDesign" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/zara-home.svg" alt="ZARA HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/hm-home.svg" alt="H&M HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/midrag.png" alt="מידרג" className="h-8" /></span>
          <span className="brand-item"><img src="/logos/ace.png" alt="ACE" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/homecenter.png" alt="הום סנטר" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/tambur.png" alt="טמבור" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/ikea.svg" alt="IKEA" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/foxhome.png" alt="FOX home" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/castro.png" alt="Castro HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/idesign.png" alt="iDesign" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/zara-home.svg" alt="ZARA HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/hm-home.svg" alt="H&M HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/midrag.png" alt="מידרג" className="h-8" /></span>
          <span className="brand-item"><img src="/logos/ace.png" alt="ACE" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/homecenter.png" alt="הום סנטר" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/tambur.png" alt="טמבור" className="h-6 rounded" /></span>
          <span className="brand-item"><img src="/logos/ikea.svg" alt="IKEA" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/foxhome.png" alt="FOX home" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/castro.png" alt="Castro HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/idesign.png" alt="iDesign" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/zara-home.svg" alt="ZARA HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/hm-home.svg" alt="H&M HOME" className="h-6" /></span>
          <span className="brand-item"><img src="/logos/midrag.png" alt="מידרג" className="h-8" /></span>
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
                  <Image 
                    src="/before-room.webp" 
                    alt="לפני השיפוץ"
                    width={400}
                    height={300}
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
                  <Image 
                    src="/after-room.webp" 
                    alt="אחרי השיפוץ"
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:brightness-110 transition-all"
                  />
                  <div className="absolute bottom-0 left-0 right-0 text-white text-sm py-2 text-center" style={{ backgroundColor: '#101010' }}>
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
              <div className="absolute -top-3 -right-3 text-white text-xs font-medium px-3 py-1 rounded-full" style={{ backgroundColor: '#101010' }}>
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
                  className="inline-block text-white px-8 py-4 rounded-full text-base hover:opacity-90 hover-bounce hover-shine"
                  style={{ backgroundColor: '#101010' }}
                >
                  {hasVisionSubscription ? '🎨 צור הדמיה' : 'נסו עכשיו'}
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

      {/* Features */}
      <section id="features" className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900">כל מה שצריך.</h2>
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

      {/* Newsletter Popup */}
      {showNewsletterPopup && !subscribed && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => {
                setShowNewsletterPopup(false);
                localStorage.setItem('newsletter_popup_dismissed', 'true');
                // Also save to DB for logged in users
                const userData = localStorage.getItem("user");
                if (userData) {
                  const user = JSON.parse(userData);
                  if (user.id) dismissNewsletter(user.id);
                }
              }}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">קבלו טיפים לשיפוץ חכם</h2>
              <p className="text-gray-500 mb-6">הצטרפו ל-500+ משפצים שמקבלים טיפים שבועיים</p>
              
              <form onSubmit={(e) => { handleSubscribe(e); setShowNewsletterPopup(false); }} className="flex flex-col gap-3">
                <label htmlFor="newsletter-email" className="sr-only">כתובת אימייל</label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  aria-label="כתובת אימייל להרשמה לניוזלטר"
                  className="w-full px-5 py-4 border border-gray-200 rounded-full text-base focus:outline-none focus:border-gray-900 text-left"
                  dir="ltr"
                  required
                />
                <button
                  type="submit"
                  className="w-full text-white px-8 py-4 rounded-full text-base font-medium hover:opacity-90 transition-colors"
                  style={{ backgroundColor: '#101010' }}
                >
                  הרשמה
                </button>
              </form>
              <p className="text-xs text-gray-500 mt-4">ללא ספאם. אפשר להסיר בכל עת.</p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing - hide for users with subscription */}
      {!isPremium && (
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">פשוט.</h2>
          <p className="text-gray-500 mb-12">תשלום אחד. לכל משך הפרויקט.</p>
          
          <PricingComparison />
        </div>
      </section>
      )}

      {/* About / Our Story - Premium B&W */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src="/images/about-bg.webp" 
            alt="" 
            fill 
            className="object-cover"
            quality={90}
          />
          <div className="absolute inset-0 bg-black/75"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-gray-400 text-sm tracking-widest uppercase mb-4">הסיפור שלנו</p>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">מי אנחנו</h2>
            <div className="w-16 h-px bg-white/30 mx-auto"></div>
          </div>
          
          <div className="relative">
            {/* Subtle border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl blur-xl"></div>
            
            <div className="relative bg-black/60 backdrop-blur-sm rounded-2xl p-10 md:p-14 border border-white/10">
              <div className="space-y-8 text-right">
                <p className="text-xl md:text-2xl text-white font-light leading-relaxed">
                  בנינו את <span className="font-semibold">ShiputzAI</span> כי עברנו את זה בעצמנו.
                </p>
                
                <p className="text-gray-400 text-lg leading-relaxed">
                  שיפוצים שיצאו משליטה, קבלות שהלכו לאיבוד, והרגשה שמישהו תמיד מנפח לנו את המחיר.
                </p>
                
                <p className="text-gray-400 text-lg leading-relaxed">
                  רצינו כלי פשוט שעושה את העבודה. בלי סיבוכים, בלי להתעסק עם אקסלים, בלי להרגיש אבודים.
                </p>
                
                <div className="border-r-2 border-white/30 pr-6 my-10">
                  <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">
                    המטרה שלנו: שכל מי שנכנס לשיפוץ ירגיש בשליטה.
                  </p>
                </div>
                
                <p className="text-gray-400 text-lg leading-relaxed">
                  שידע בדיוק לאן הולך הכסף, שיקבל התראה לפני שחורג, ושיוכל לבדוק אם המחיר שמציעים לו הגיוני.
                </p>
                
                <p className="text-gray-500 text-lg leading-relaxed">
                  אנחנו צוות קטן שאוהב לפתור בעיות אמיתיות. אם יש לכם רעיון לשיפור, נשמח לשמוע.
                </p>
                
                <div className="pt-8 border-t border-white/10">
                  <p className="text-white/60 text-base">
                    צוות ShiputzAI
                  </p>
                </div>
              </div>
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
              question="מה אם אני לא מבין בטכנולוגיה?"
              answer="אם אתם יודעים לצלם תמונה בטלפון, אתם יודעים להשתמש ב-ShiputzAI. רציני. זה פשוט."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-white" style={{ backgroundColor: '#101010' }}>
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
            <a href="/contact" className="hover:text-gray-900">צור קשר</a>
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

