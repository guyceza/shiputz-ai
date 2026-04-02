"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import HeroAnimation from "@/components/HeroAnimation";

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

import PricingComparison from "@/components/PricingComparison";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import Footer from "@/components/Footer";
import { isAdminEmail } from "@/lib/admin";
import StatsCounter from "@/components/StatsCounter";
import RoleSelector from "@/components/RoleSelector";
import type { Role } from "@/components/RoleSelector";

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [hasVisionSubscription, setHasVisionSubscription] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'role' | 'all'>('role');

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "מה זה קרדיט ולמה צריך אותו?", "acceptedAnswer": {"@type": "Answer", "text": "קרדיט = שימוש אחד בכלי AI. הדמיית חדר עולה 5 קרדיטים, סרטון סיור 25, ניתוח הצעת מחיר 3. בהרשמה מקבלים 10 קרדיטים בחינם — מספיק לשני ניסיונות. אפשר לקנות חבילות מ-₪29."}},
      {"@type": "Question", "name": "אפשר לנסות בלי להירשם?", "acceptedAnswer": {"@type": "Answer", "text": "כן! לחצו 'נסו הדמיה עכשיו' ותעלו תמונה. תקבלו תוצאה מלאה כאורח. בשביל לשמור תוצאות ולקבל יותר קרדיטים — תירשמו בחינם."}},
      {"@type": "Question", "name": "מה קורה עם התמונות שאני מעלה?", "acceptedAnswer": {"@type": "Answer", "text": "התמונות מעובדות ב-AI ונשמרות בחשבון שלכם בלבד. אנחנו לא משתמשים בהן לאימון מודלים, לא משתפים עם צדדים שלישיים, ולא מציגים אותן באתר. אתם הבעלים."}},
      {"@type": "Question", "name": "איך ההדמיה עובדת?", "acceptedAnswer": {"@type": "Answer", "text": "מעלים תמונה של חדר + כותבים מה רוצים לשנות (למשל 'סלון מודרני עם ספה אפורה'). ה-AI יוצר תמונה חדשה של אותו חדר בדיוק — אחרי השינוי. תוך 30 שניות."}},
      {"@type": "Question", "name": "מתאים גם למעצבי פנים?", "acceptedAnswer": {"@type": "Answer", "text": "בהחלט. מעצבים משתמשים בהדמיות כדי להציג ללקוחות לפני שמתחילים, ב-Style Match כדי לזהות סגנונות, וב-Shop the Look למציאת מוצרים. חוסך שעות עבודה."}},
      {"@type": "Question", "name": "כמה עולה הדמיית שיפוץ?", "acceptedAnswer": {"@type": "Answer", "text": "הדמיית שיפוץ בShiputzAI עולה 5 קרדיטים, שזה בערך ₪3-15 בהתאם לחבילה. חבילת 10 קרדיטים עולה ₪29, חבילת 30 ₪69, וחבילת 100 ₪149. בהרשמה מקבלים 10 קרדיטים חינם."}},
      {"@type": "Question", "name": "מה ההבדל בין ShiputzAI לInteriorAI?", "acceptedAnswer": {"@type": "Answer", "text": "ShiputzAI מתמקד בשוק הישראלי עם ממשק בעברית, תמיכה בעברית, ו-7 כלי AI כולל כתב כמויות, סרטון סיור, וניתוח הצעות מחיר. InteriorAI מציע רק הדמיות בסיסיות באנגלית."}},
      {"@type": "Question", "name": "האם ShiputzAI מתאים לקבלנים?", "acceptedAnswer": {"@type": "Answer", "text": "כן. קבלני שיפוצים משתמשים בShiputzAI כדי להציג ללקוחות הדמיות לפני תחילת עבודה, ליצור כתבי כמויות אוטומטיים, ולנתח הצעות מחיר של ספקים."}},
      {"@type": "Question", "name": "איך עובד סרטון הסיור?", "acceptedAnswer": {"@type": "Answer", "text": "מעלים תמונה של חדר, בוחרים סגנון עיצוב, והAI יוצר סרטון סיור קצר שמדמה הליכה בחדר המעוצב. מושלם להצגה ללקוחות או לשיתוף ברשתות חברתיות."}},
      {"@type": "Question", "name": "האם אפשר להשתמש בShiputzAI לעסק?", "acceptedAnswer": {"@type": "Answer", "text": "בהחלט. מעצבי פנים, אדריכלים, קבלנים וסוכני נדל״ן משתמשים בShiputzAI לצורך מקצועי. חבילת Pro כוללת שימוש מסחרי, 200 קרדיטים לחודש, וגישה לכל הכלים."}}
    ]
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "איך ליצור הדמיית עיצוב פנים בAI",
    "description": "מדריך פשוט ליצירת הדמיית עיצוב פנים באמצעות בינה מלאכותית בShiputzAI",
    "totalTime": "PT1M",
    "estimatedCost": {"@type": "MonetaryAmount", "currency": "ILS", "value": "0"},
    "step": [
      {"@type": "HowToStep", "position": 1, "name": "העלאת תמונה", "text": "היכנסו לאתר shipazti.com, לחצו 'נסו הדמיה עכשיו' והעלו תמונה של החדר שתרצו לעצב."},
      {"@type": "HowToStep", "position": 2, "name": "תיאור השינוי", "text": "כתבו בעברית מה אתם רוצים לשנות, למשל 'סלון מודרני עם ספה אפורה וקירות לבנים'. אפשר גם לבחור מתוך 30+ סגנונות מוכנים."},
      {"@type": "HowToStep", "position": 3, "name": "קבלת התוצאה", "text": "תוך 30 שניות תקבלו הדמיה מלאה של החדר אחרי השינוי. אפשר להוריד, לשתף, או להמשיך לכלים נוספים כמו כתב כמויות או סרטון סיור."}
    ]
  };

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
            if (user.role) setUserRole(user.role);
          }
        }
        
        // Fallback to Supabase session
        if (!userEmail) {
          const { getSession } = await import("@/lib/auth");
          const session = await getSession();
          if (session?.user) {
            setIsLoggedIn(true);
            setIsAdmin(isAdminEmail(session.user.email || ""));
            userEmail = session.user.email || null;
            const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
            setIsPremium(storedUser.purchased === true);
            const role = session.user.user_metadata?.role || storedUser.role;
            if (role) setUserRole(role);
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

  // Show role modal for logged-in users without role (after auth loads)
  useEffect(() => {
    if (isLoggedIn && !userRole) {
      // Small delay so the page renders first
      const t = setTimeout(() => setShowRoleModal(true), 500);
      return () => clearTimeout(t);
    }
  }, [isLoggedIn, userRole]);
  
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [popupLottie, setPopupLottie] = useState<any>(null);

  // Load Lottie animation for popup
  useEffect(() => {
    fetch('/lottie-home-popup.json')
      .then(r => r.json())
      .then(setPopupLottie)
      .catch(() => {});
  }, []);
  
  // Exit intent popup (desktop: mouse leaves viewport, mobile: scroll up after 30s)
  useEffect(() => {
    const dismissed = localStorage.getItem('promo_dismissed');
    if (dismissed) return;
    
    // Don't show to logged-in or premium users
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.purchased || user.id) return;
      } catch {}
    }
    
    let shown = false;
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    // Desktop: mouse leaves top of viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !shown) {
        shown = true;
        setShowPromoPopup(true);
      }
    };
    
    // Mobile fallback: show after 30s of engagement
    scrollTimeout = setTimeout(() => {
      if (!shown) {
        shown = true;
        setShowPromoPopup(true);
      }
    }, 30000);
    
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // handleSubscribe removed

  return (
    <div className="min-h-screen">
      {/* Skip to content */}
      <a href="#features" className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:right-0 focus:z-[60] focus:bg-white focus:px-4 focus:py-2 focus:text-gray-900 focus:shadow-lg">
        דלג לתוכן
      </a>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 h-11 bg-white/80 backdrop-blur-xl z-50 border-b border-gray-200/50" aria-label="ניווט ראשי">
        <div className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="text-base font-semibold text-gray-900">
            ShiputzAI
          </Link>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/ai-vision" className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-all">
              🎨 AI Vision
            </Link>
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
          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {isLoggedIn ? (
              <Link href="/dashboard" className="text-xs text-white bg-gray-900 px-3 py-1.5 rounded-full">
                לאזור האישי
              </Link>
            ) : (
              <Link href="/login" className="text-xs text-white bg-gray-900 px-3 py-1.5 rounded-full">
                התחברות
              </Link>
            )}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900"
              aria-label="תפריט"
              aria-expanded={mobileMenu}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenu ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenu && (
        <div className="fixed top-11 left-0 right-0 bg-white border-b border-gray-200 z-40 md:hidden shadow-lg" dir="rtl">
          <div className="px-6 py-4 space-y-3">
            <Link href="/ai-vision" className="block text-sm text-gray-700 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              🎨 AI Vision — כלי העיצוב
            </Link>
            <Link href="/visualize" className="block text-sm text-gray-700 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              הדמיית עיצוב
            </Link>
            <Link href="/style-match" className="block text-sm text-gray-700 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              זיהוי סגנון
            </Link>
            <Link href="/pricing" className="block text-sm text-gray-700 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              תוכניות ומחירים
            </Link>
            <Link href="/tips" className="block text-sm text-gray-700 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              מאמרים וטיפים
            </Link>
            <Link href="/contact" className="block text-sm text-gray-700 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              צור קשר
            </Link>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            {/* Text Content */}
            <div className="flex-1 text-center lg:text-right">
              <p className="text-sm text-gray-500 mb-4">AI לעיצוב הבית</p>
              <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4 text-gray-900">
                עצבו את הבית. בלחיצה.
              </h1>
              <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-8 leading-relaxed mx-auto lg:mx-0">
                העלו תמונה של חדר — קבלו הדמיית עיצוב, רשימת קניות, וסרטון סיור. הכל ב-AI.
              </p>
              <div className="flex gap-4 flex-wrap justify-center lg:justify-start">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="text-white px-8 py-4 rounded-full text-base hover:opacity-90 transition-colors bg-[#101010]"
                  >
                    לאזור האישי
                  </Link>
                ) : (
                  <Link
                    href="/signup"
                    className="text-white px-8 py-4 rounded-full text-base hover:opacity-90 hover-bounce hover-shine bg-[#101010]"
                  >
                    התחילו בחינם
                  </Link>
                )}
                <Link
                  href="/ai-vision"
                  className="text-gray-900 px-8 py-4 rounded-full text-base border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-all"
                >
                  גלו את הכלים
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
      <section className="py-4 px-6 border-b border-gray-100" aria-label="תכונות עיקריות">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50 animate-pulse"></span>
              מאובטח ופרטי
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50 animate-pulse"></span>
              ללא עלות לנסות
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50 animate-pulse"></span>
              מבוסס AI
            </span>
          </div>
        </div>
      </section>

      {/* Trusted Sources Bar - Infinite Carousel */}
      <section className="py-8 bg-gray-50 border-y border-gray-100 overflow-hidden" dir="ltr" aria-label="מקורות מידע">
        <p className="text-center text-sm text-gray-500 mb-5" dir="rtl">מחירונים מבוססים על נתונים מ:</p>
        <BrandsMarquee />
      </section>

      {/* AI Vision — Features Showcase */}
      <section id="features" className="py-24 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-gray-400 text-sm tracking-widest uppercase mb-4">AI Vision</p>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">כל הכלים. מקום אחד.</h2>
            <p className="text-gray-500 max-w-lg mx-auto">שבעה כלי AI שעוזרים לכם לתכנן, לדמיין, ולחסוך</p>
          </div>
          <FeaturesShowcase userRole={viewMode === 'all' ? null : userRole} />
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section className="py-20 px-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-sm text-gray-400 tracking-widest uppercase mb-12">מה אומרים המשתמשים</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex gap-1 mb-3 text-amber-400">{'★'.repeat(5)}</div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">&quot;העליתי תמונה של הסלון וקיבלתי הדמיה תוך 30 שניות. הלקוחה שלי התלהבה ואישרה את הפרויקט באותו יום.&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">ר</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">רונית א.</p>
                  <p className="text-xs text-gray-500">מעצבת פנים, תל אביב</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex gap-1 mb-3 text-amber-400">{'★'.repeat(5)}</div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">&quot;השתמשתי בניתוח הצעת מחיר וגיליתי שהקבלן חייב אותי ₪8,000 יותר מהמחיר הנכון. שווה כל שקל.&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">י</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">יוסי כ.</p>
                  <p className="text-xs text-gray-500">בעל דירה, רמת גן</p>
                </div>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex gap-1 mb-3 text-amber-400">{'★'.repeat(5)}</div>
              <p className="text-gray-700 text-sm leading-relaxed mb-4">&quot;הכלי Style Match זיהה בדיוק את הסגנון שחיפשתי ונתן לי רשימת מוצרים עם לינקים. חסך לי שעות של חיפושים.&quot;</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">מ</div>
                <div>
                  <p className="text-sm font-medium text-gray-900">מיכל ל.</p>
                  <p className="text-xs text-gray-500">מעצבת פנים, הרצליה</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>




      {/* Pricing Popup */}
      {showPromoPopup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full relative shadow-2xl animate-in zoom-in-95 duration-300" dir="rtl">
            <button
              onClick={() => {
                setShowPromoPopup(false);
                localStorage.setItem('promo_dismissed', 'true');
              }}
              className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4">
                {popupLottie ? (
                  <Lottie animationData={popupLottie} loop={true} />
                ) : (
                  <div className="text-5xl">🏠</div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">רוצים לראות איך הבית ייראה?</h2>
              <p className="text-gray-500 mb-5">העלו תמונה וקבלו הדמיית עיצוב תוך 30 שניות</p>
              
              <div className="bg-gray-50 rounded-2xl p-5 mb-5">
                <div className="flex items-center justify-center gap-3 mb-1">
                  <span className="text-3xl font-bold text-gray-900">10 קרדיטים חינם</span>
                </div>
                <p className="text-sm text-gray-500">בהרשמה — בלי כרטיס אשראי</p>
              </div>
              
              <ul className="text-right space-y-2 mb-6 text-sm text-gray-700">
                <li className="flex items-center gap-2"><span>✓</span>הדמיות עיצוב AI</li>
                <li className="flex items-center gap-2"><span>✓</span>זיהוי סגנון + רשימת קניות</li>
                <li className="flex items-center gap-2"><span>✓</span>ניתוח הצעות מחיר</li>
                <li className="flex items-center gap-2"><span>✓</span>Shop the Look + צ׳אט תמיכה</li>
              </ul>

              <a
                href="/visualize"
                className="block w-full text-white px-8 py-4 rounded-full text-base font-medium hover:opacity-90 transition-colors text-center bg-[#101010]"
              >
                נסו הדמיה עכשיו
              </a>
              <p className="text-xs text-gray-400 mt-3">חבילות מ-₪29 · או הירשמו בחינם</p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing - hide for users with subscription */}
      {!isPremium && (
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">תוכניות ומחירים</h2>
          <p className="text-gray-500 mb-12">התחילו בחינם — שדרגו כשתרצו</p>
          
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
            alt="רקע אודות ShiputzAI - שיפוץ חכם" 
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
                  בנינו את <span className="font-semibold">ShiputzAI</span> כי רצינו לראות את הבית החדש — לפני שמתחילים.
                </p>
                
                <p className="text-gray-400 text-lg leading-relaxed">
                  להבין איך הסלון ייראה עם רצפת עץ, איזה צבע מתאים לקירות, ואם הספה הזאת בכלל עובדת פה.
                </p>
                
                <p className="text-gray-400 text-lg leading-relaxed">
                  אז בנינו כלי שעושה את זה תוך שניות. מעלים תמונה, כותבים מה רוצים, ומקבלים הדמיה מלאה.
                </p>
                
                <div className="border-r-2 border-white/30 pr-6 my-10">
                  <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">
                    המטרה שלנו: שכל מי שמעצב בית יוכל לדמיין אותו לפני שמוציא שקל.
                  </p>
                </div>
                
                <p className="text-gray-400 text-lg leading-relaxed">
                  7 כלי AI. הדמיות, זיהוי סגנון, רשימת קניות, סרטון סיור, ניתוח הצעות מחיר. הכל ממקום אחד.
                </p>
                
                <p className="text-gray-500 text-lg leading-relaxed">
                  נבנה בישראל, בעברית, עם מחירי שוק ישראליים. אם יש לכם רעיון לשיפור — נשמח לשמוע.
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
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-4">שאלות נפוצות</h2>
            <p className="text-gray-500">תשובות לשאלות שמשתמשים שואלים</p>
          </div>
          
          <div className="space-y-6">
            <FaqItem 
              question="מה זה קרדיט ולמה צריך אותו?"
              answer="קרדיט = שימוש אחד בכלי AI. הדמיית חדר עולה 5 קרדיטים, סרטון סיור 25, ניתוח הצעת מחיר 3. בהרשמה מקבלים 10 קרדיטים בחינם — מספיק לשני ניסיונות. אפשר לקנות חבילות מ-₪29."
            />
            <FaqItem 
              question="אפשר לנסות בלי להירשם?"
              answer="כן! לחצו 'נסו הדמיה עכשיו' ותעלו תמונה. תקבלו תוצאה מלאה כאורח. בשביל לשמור תוצאות ולקבל יותר קרדיטים — תירשמו בחינם."
            />
            <FaqItem 
              question="מה קורה עם התמונות שאני מעלה?"
              answer="התמונות מעובדות ב-AI ונשמרות בחשבון שלכם בלבד. אנחנו לא משתמשים בהן לאימון מודלים, לא משתפים עם צדדים שלישיים, ולא מציגים אותן באתר. אתם הבעלים."
            />
            <FaqItem 
              question="איך ההדמיה עובדת?"
              answer="מעלים תמונה של חדר + כותבים מה רוצים לשנות (למשל 'סלון מודרני עם ספה אפורה'). ה-AI יוצר תמונה חדשה של אותו חדר בדיוק — אחרי השינוי. תוך 30 שניות."
            />
            <FaqItem 
              question="מתאים גם למעצבי פנים?"
              answer="בהחלט. מעצבים משתמשים בהדמיות כדי להציג ללקוחות לפני שמתחילים, ב-Style Match כדי לזהות סגנונות, וב-Shop the Look למציאת מוצרים. חוסך שעות עבודה."
            />
            <FaqItem 
              question="כמה עולה הדמיית שיפוץ?"
              answer="הדמיית שיפוץ בShiputzAI עולה 5 קרדיטים, שזה בערך ₪3-15 בהתאם לחבילה. חבילת 10 קרדיטים עולה ₪29, חבילת 30 ₪69, וחבילת 100 ₪149. בהרשמה מקבלים 10 קרדיטים חינם."
            />
            <FaqItem 
              question="מה ההבדל בין ShiputzAI לInteriorAI?"
              answer="ShiputzAI מתמקד בשוק הישראלי עם ממשק בעברית, תמיכה בעברית, ו-7 כלי AI כולל כתב כמויות, סרטון סיור, וניתוח הצעות מחיר. InteriorAI מציע רק הדמיות בסיסיות באנגלית."
            />
            <FaqItem 
              question="האם ShiputzAI מתאים לקבלנים?"
              answer="כן. קבלני שיפוצים משתמשים בShiputzAI כדי להציג ללקוחות הדמיות לפני תחילת עבודה, ליצור כתבי כמויות אוטומטיים, ולנתח הצעות מחיר של ספקים."
            />
            <FaqItem 
              question="איך עובד סרטון הסיור?"
              answer="מעלים תמונה של חדר, בוחרים סגנון עיצוב, והAI יוצר סרטון סיור קצר שמדמה הליכה בחדר המעוצב. מושלם להצגה ללקוחות או לשיתוף ברשתות חברתיות."
            />
            <FaqItem 
              question="האם אפשר להשתמש בShiputzAI לעסק?"
              answer="בהחלט. מעצבי פנים, אדריכלים, קבלנים וסוכני נדל״ן משתמשים בShiputzAI לצורך מקצועי. חבילת Pro כוללת שימוש מסחרי, 200 קרדיטים לחודש, וגישה לכל הכלים."
            />
          </div>
        </div>
      </section>

      {/* Referral */}
      <section className="py-16 px-6 bg-gradient-to-l from-emerald-50 to-teal-50">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-4xl mb-4 block">🎁</span>
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">הזמינו חבר — שניכם מרוויחים</h2>
          <p className="text-gray-600 mb-6">שתפו את הלינק שלכם עם חברים ועמיתים. על כל חבר שנרשם — <strong>שניכם מקבלים 20 קרדיטים חינם</strong>.</p>
          <Link
            href={isLoggedIn ? "/dashboard#referral" : "/signup"}
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full text-base hover:bg-gray-800 transition-all"
          >
            {isLoggedIn ? "קבלו את הלינק שלכם" : "הירשמו וקבלו לינק אישי"}
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-white bg-[#101010]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">{isLoggedIn ? "הפרויקטים שלך מחכים" : "מוכנים לראות את הבית החדש?"}</h2>
          <p className="text-gray-400 mb-8">{isLoggedIn ? "חזור לאזור האישי ותמשיך מאיפה שהפסקת." : "העלו תמונה וקבלו הדמיה תוך 30 שניות. בחינם."}</p>
          <Link
            href={isLoggedIn ? "/dashboard" : "/signup"}
            className="inline-block bg-white text-gray-900 px-8 py-4 rounded-full text-base hover:bg-gray-100 hover-bounce hover-shine"
          >
            {isLoggedIn ? "לאזור האישי" : "התחילו בחינם"}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* AIEO Schema - FAQPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {"@type": "Question", "name": "מה זה קרדיט ולמה צריך אותו?", "acceptedAnswer": {"@type": "Answer", "text": "קרדיט = שימוש אחד בכלי AI. הדמיית חדר עולה 5 קרדיטים, סרטון סיור 25, ניתוח הצעת מחיר 3. בהרשמה מקבלים 10 קרדיטים בחינם — מספיק לשני ניסיונות. אפשר לקנות חבילות מ-₪29."}},
          {"@type": "Question", "name": "אפשר לנסות בלי להירשם?", "acceptedAnswer": {"@type": "Answer", "text": "כן! לחצו 'נסו הדמיה עכשיו' ותעלו תמונה. תקבלו תוצאה מלאה כאורח. בשביל לשמור תוצאות ולקבל יותר קרדיטים — תירשמו בחינם."}},
          {"@type": "Question", "name": "מה קורה עם התמונות שאני מעלה?", "acceptedAnswer": {"@type": "Answer", "text": "התמונות מעובדות ב-AI ונשמרות בחשבון שלכם בלבד. אנחנו לא משתמשים בהן לאימון מודלים, לא משתפים עם צדדים שלישיים, ולא מציגים אותן באתר. אתם הבעלים."}},
          {"@type": "Question", "name": "איך ההדמיה עובדת?", "acceptedAnswer": {"@type": "Answer", "text": "מעלים תמונה של חדר + כותבים מה רוצים לשנות. ה-AI יוצר תמונה חדשה של אותו חדר בדיוק — אחרי השינוי. תוך 30 שניות."}},
          {"@type": "Question", "name": "מתאים גם למעצבי פנים?", "acceptedAnswer": {"@type": "Answer", "text": "בהחלט. מעצבים משתמשים בהדמיות כדי להציג ללקוחות לפני שמתחילים, ב-Style Match כדי לזהות סגנונות, וב-Shop the Look למציאת מוצרים. חוסך שעות עבודה."}},
          {"@type": "Question", "name": "כמה עולה הדמיית שיפוץ?", "acceptedAnswer": {"@type": "Answer", "text": "הדמיית שיפוץ בShiputzAI עולה 5 קרדיטים, שזה בערך ₪3-15 בהתאם לחבילה. חבילת 10 קרדיטים עולה ₪29, חבילת 30 ₪69, וחבילת 100 ₪149. בהרשמה מקבלים 10 קרדיטים חינם."}},
          {"@type": "Question", "name": "מה ההבדל בין ShiputzAI לInteriorAI?", "acceptedAnswer": {"@type": "Answer", "text": "ShiputzAI מתמקד בשוק הישראלי עם ממשק בעברית, תמיכה בעברית, ו-7 כלי AI כולל כתב כמויות, סרטון סיור, וניתוח הצעות מחיר. InteriorAI מציע רק הדמיות בסיסיות באנגלית."}},
          {"@type": "Question", "name": "האם ShiputzAI מתאים לקבלנים?", "acceptedAnswer": {"@type": "Answer", "text": "כן. קבלני שיפוצים משתמשים בShiputzAI כדי להציג ללקוחות הדמיות לפני תחילת עבודה, ליצור כתבי כמויות אוטומטיים, ולנתח הצעות מחיר של ספקים."}},
          {"@type": "Question", "name": "איך עובד סרטון הסיור?", "acceptedAnswer": {"@type": "Answer", "text": "מעלים תמונה של חדר, בוחרים סגנון עיצוב, והAI יוצר סרטון סיור קצר שמדמה הליכה בחדר המעוצב. מושלם להצגה ללקוחות או לשיתוף ברשתות חברתיות."}},
          {"@type": "Question", "name": "האם אפשר להשתמש בShiputzAI לעסק?", "acceptedAnswer": {"@type": "Answer", "text": "בהחלט. מעצבי פנים, אדריכלים, קבלנים וסוכני נדל״ן משתמשים בShiputzAI לצורך מקצועי. חבילת Pro כוללת שימוש מסחרי, 200 קרדיטים לחודש, וגישה לכל הכלים."}}
        ]
      })}} />
      
      {/* AIEO Schema - HowTo */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "איך ליצור הדמיית עיצוב פנים בAI",
        "description": "3 שלבים פשוטים ליצירת הדמיית עיצוב פנים עם ShiputzAI",
        "step": [
          {"@type": "HowToStep", "position": 1, "name": "העלאת תמונה", "text": "מעלים תמונה של החדר שרוצים לעצב מחדש"},
          {"@type": "HowToStep", "position": 2, "name": "בחירת סגנון", "text": "כותבים מה רוצים לשנות או בוחרים סגנון עיצוב"},
          {"@type": "HowToStep", "position": 3, "name": "קבלת הדמיה", "text": "ה-AI יוצר הדמיית עיצוב מלאה של החדר תוך 30 שניות"}
        ]
      })}} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(faqSchema)}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(howToSchema)}} />

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <RoleSelector onSelect={async (role: Role) => {
              try {
                const { getSupabaseClient } = await import('@/lib/supabase');
                const supabase = getSupabaseClient();
                await supabase.auth.updateUser({ data: { role: role.key } });
                
                const userData = localStorage.getItem('user');
                if (userData) {
                  const u = JSON.parse(userData);
                  u.role = role.key;
                  localStorage.setItem('user', JSON.stringify(u));
                }
                
                setUserRole(role.key);
                setShowRoleModal(false);
              } catch (err) {
                console.error('Failed to save role:', err);
                setShowRoleModal(false);
              }
            }} />
            <button
              onClick={() => setShowRoleModal(false)}
              className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              אולי אח״כ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Feature({ title, description, href }: { title: string; description: string; href?: string }) {
  const content = (
    <>
      <h3 className="text-lg font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </>
  );
  if (href) {
    return (
      <a href={href} className="group p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover-lift hover-glow block cursor-pointer">
        {content}
      </a>
    );
  }
  return (
    <div className="group p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover-lift hover-glow">
      {content}
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
  const id = question.slice(0, 20).replace(/\s/g, '-');
  
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-6 py-5 text-right flex items-center justify-between hover:bg-gray-50 transition-colors"
          aria-expanded={isOpen}
          aria-controls={`faq-${id}`}
        >
          <span className="text-base font-medium text-gray-900">{question}</span>
          <span className={`text-2xl text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
        </button>
      </h3>
      <div 
        id={`faq-${id}`}
        role="region"
        aria-labelledby={`faq-${id}`}
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
      >
        <p className="px-6 pb-5 text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

const BRAND_LOGOS = [
  { src: '/logos/ace.png', alt: 'ACE', h: 'h-6' },
  { src: '/logos/homecenter.png', alt: 'הום סנטר', h: 'h-6 rounded' },
  { src: '/logos/tambur.png', alt: 'טמבור', h: 'h-6 rounded' },
  { src: '/logos/ikea.svg', alt: 'IKEA', h: 'h-6' },
  { src: '/logos/foxhome.png', alt: 'FOX home', h: 'h-6' },
  { src: '/logos/castro.png', alt: 'Castro HOME', h: 'h-6' },
  { src: '/logos/idesign.png', alt: 'iDesign', h: 'h-6' },
  { src: '/logos/zara-home.svg', alt: 'ZARA HOME', h: 'h-6' },
  { src: '/logos/hm-home.svg', alt: 'H&M HOME', h: 'h-6' },
  { src: '/logos/midrag.png', alt: 'מידרג', h: 'h-8' },
];

function BrandsMarquee() {
  // Render 4 copies for seamless loop, but from a single array
  const items = [...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS];
  return (
    <>
      <style>{`
        .brands-marquee { display:flex; width:max-content; animation:brands-scroll 25s linear infinite; }
        .brands-marquee .brand-item { padding:0 1.5rem; white-space:nowrap; }
        @keyframes brands-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-25%)} }
      `}</style>
      <div className="brands-marquee" aria-hidden="true">
        {items.map((logo, i) => (
          <span key={i} className="brand-item">
            <img src={logo.src} alt={logo.alt} className={logo.h} loading="lazy" />
          </span>
        ))}
      </div>
    </>
  );
}

