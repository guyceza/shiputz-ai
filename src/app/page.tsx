"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

import PricingComparison from "@/components/PricingComparison";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import Footer from "@/components/Footer";
import { isAdminEmail } from "@/lib/admin";
import StatsCounter from "@/components/StatsCounter";
import { authFetch } from "@/lib/auth-fetch";
import BeforeAfterGallery from "@/components/BeforeAfterGallery";
import { CREDIT_COSTS, SIGNUP_BONUS_CREDITS } from "@/lib/credit-costs";
import { ArrowLeft } from "lucide-react";
import { trackAcquisitionEvent } from "@/lib/acquisition-tracking";

const intentCards = [
  {
    title: "רוצה מסלול אחד שמחבר הכל?",
    description: "העלו תמונה, בחרו מטרה ועוצמת שינוי, והמשיכו להדמיה, מוצרים ועלויות.",
    href: "/studio",
    cta: "פתחו סטודיו",
    surface: "border-gray-200 bg-white hover:border-gray-900 hover:bg-gray-50",
  },
  {
    title: "רוצה לראות איך זה ייראה?",
    description: "העלו תמונה וקבלו לפני/אחרי ברור לפני שקונים, צובעים או מתחילים עבודה.",
    href: "/visualize",
    cta: "הדמיית עיצוב",
    surface: "border-emerald-100 bg-emerald-50/70 hover:border-emerald-200 hover:bg-emerald-50",
  },
  {
    title: "רוצה לדעת כמה זה יעלה?",
    description: "קבלו טווחי מחיר ישראליים כדי להבין סדר גודל לפני שיחה עם בעל מקצוע.",
    href: "/pricing-guide",
    cta: "מחירון כללי",
    surface: "border-sky-100 bg-sky-50/70 hover:border-sky-200 hover:bg-sky-50",
  },
  {
    title: "רוצה לבדוק הצעה שקיבלת?",
    description: "מסמנים חריגות, סעיפים חסרים ושאלות שכדאי להחזיר לבעל המקצוע.",
    href: "/quote-analysis",
    cta: "ניתוח הצעה",
    surface: "border-amber-100 bg-amber-50/75 hover:border-amber-200 hover:bg-amber-50",
  },
  {
    title: "צריך כתב כמויות?",
    description: "הופכים תוכנית לדוח כמויות שאפשר להוריד, לערוך ולשלוח הלאה.",
    href: "/dashboard/bill-of-quantities",
    cta: "כתב כמויות",
    surface: "border-rose-100 bg-rose-50/65 hover:border-rose-200 hover:bg-rose-50",
  },
];

const seoTopicLinks = [
  { href: "/tips/room-visualization-ai", label: "הדמיית חדרים" },
  { href: "/tips/ai-renovation-from-photo", label: "הדמיית שיפוץ מתמונה" },
  { href: "/tips/hebrew-ai-interior-design", label: "עיצוב פנים AI בעברית" },
  { href: "/tips/ai-kitchen-renovation", label: "הדמיית מטבח AI" },
  { href: "/tips/living-room-before-after-ai", label: "הדמיית סלון לפני שיפוץ" },
  { href: "/tips/floor-plan-ai-israel", label: "תוכנית דירה ל-AI" },
  { href: "/tips/interiorai-alternative-israel", label: "חלופה ישראלית ל-InteriorAI" },
];

export default function Home() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [hasVisionSubscription, setHasVisionSubscription] = useState(false);
  const showGuestTrial = !isLoggedIn;
  const creditFaqText = `קרדיט = שימוש בכלי AI איכותי. הדמיית חדר עולה ${CREDIT_COSTS.visualize} קרדיטים, תוכנית קומה ${CREDIT_COSTS.floorplan}, כתב כמויות ${CREDIT_COSTS["bill-of-quantities"]}, סרטון סיור ${CREDIT_COSTS["video-walkthrough"]}, ניתוח הצעת מחיר ${CREDIT_COSTS["analyze-quote"]}. בהרשמה מקבלים ${SIGNUP_BONUS_CREDITS} קרדיטים בחינם להיכרות, והכלים הכבדים מיועדים למנוי פעיל. מנויים פעילים יכולים להוסיף קרדיטים חד-פעמיים שלא מתאפסים.`;
  const visualizationCostText = `הדמיית שיפוץ בShiputzAI עולה ${CREDIT_COSTS.visualize} קרדיטים. משתמש חדש מקבל ניסיון ראשון חינם ו-${SIGNUP_BONUS_CREDITS} קרדיטים לניסיון, ובהמשך עובדים דרך מנוי חודשי או שנתי. מנויים פעילים יכולים לקנות קרדיטים נוספים שלא מתאפסים.`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {"@type": "Question", "name": "מה זה קרדיט ולמה צריך אותו?", "acceptedAnswer": {"@type": "Answer", "text": creditFaqText}},
      {"@type": "Question", "name": "אפשר לנסות בלי להירשם?", "acceptedAnswer": {"@type": "Answer", "text": "כן! לחצו 'נסו הדמיה עכשיו' ותעלו תמונה. תקבלו תוצאה מלאה כאורח. בשביל לשמור תוצאות ולקבל יותר קרדיטים - תירשמו בחינם."}},
      {"@type": "Question", "name": "מה קורה עם התמונות שאני מעלה?", "acceptedAnswer": {"@type": "Answer", "text": "התמונות מעובדות ב-AI ונשמרות בחשבון שלכם בלבד. אנחנו לא משתמשים בהן לאימון מודלים, לא משתפים עם צדדים שלישיים, ולא מציגים אותן באתר. אתם הבעלים."}},
      {"@type": "Question", "name": "איך ההדמיה עובדת?", "acceptedAnswer": {"@type": "Answer", "text": "מעלים תמונה של חדר + כותבים מה רוצים לשנות (למשל 'סלון מודרני עם ספה אפורה'). ה-AI יוצר תמונה חדשה של אותו חדר בדיוק - אחרי השינוי. תוך 30 שניות."}},
      {"@type": "Question", "name": "מתאים גם למעצבי פנים?", "acceptedAnswer": {"@type": "Answer", "text": "בהחלט. מעצבים משתמשים בהדמיות כדי להציג ללקוחות לפני שמתחילים, ב-Style Match כדי לזהות סגנונות, וב-Shop the Look למציאת מוצרים. חוסך שעות עבודה."}},
      {"@type": "Question", "name": "כמה עולה הדמיית שיפוץ?", "acceptedAnswer": {"@type": "Answer", "text": visualizationCostText}},
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
          }
        }
        
        // Check premium & vision from database (most reliable)
        if (userEmail) {
          try {
            const res = await authFetch(`/api/admin/premium?email=${encodeURIComponent(userEmail)}`);
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
  
  const [mobileMenu, setMobileMenu] = useState(false);

  // handleSubscribe removed

  return (
    <div className={`min-h-screen ${showGuestTrial ? "pb-20 md:pb-0" : ""}`}>
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
            <Link href="/studio" className="text-xs text-gray-900 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-all">
              סטודיו
            </Link>
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
            <Link href="/studio" className="block text-sm font-semibold text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              סטודיו מאוחד
            </Link>
            <Link href="/ai-vision" className="block text-sm text-gray-700 hover:text-gray-900 py-2" onClick={() => setMobileMenu(false)}>
              🎨 AI Vision - כלי העיצוב
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

      <BeforeAfterGallery showGuestTrial={showGuestTrial} />

      <section className="relative overflow-hidden border-y border-gray-100 bg-[#f8f7f4] pb-8 pt-0" dir="ltr" aria-label="מקורות מידע">
        <p className="mb-5 text-center text-sm text-gray-500" dir="rtl">מחירונים מבוססים על נתונים מ:</p>
        <BrandsMarquee />
      </section>

      {/* Intent Navigation */}
      <section className="px-6 pb-14 pt-10 md:pb-16 md:pt-12">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-10">
            {/* Stats with counting animation */}
            <StatsCounter />
          </div>
          <div id="features" className="mb-12 border-t border-gray-100 pt-12 md:mb-14 md:pt-14">
            <div className="text-center mb-10 md:mb-12">
              <p className="text-gray-400 text-sm tracking-widest uppercase mb-4">AI Vision</p>
              <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3">כל החלטה מקבלת כלי.</h2>
              <p className="text-gray-500 max-w-lg mx-auto">הדמיה, תוכנית קומה, כתב כמויות וניתוח הצעה מתחברים לתהליך אחד.</p>
            </div>
            <FeaturesShowcase />
          </div>
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-400 tracking-widest uppercase mb-2">מה צריך עכשיו?</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">בחרו לפי השאלה שמעסיקה אתכם.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-5">
            {intentCards.map((card) => (
              <Link
                key={card.title}
                href={showGuestTrial && card.href === "/visualize" ? "/visualize?trial=home_intent" : card.href}
                onClick={() => {
                  const targetUrl = showGuestTrial && card.href === "/visualize" ? "/visualize?trial=home_intent" : card.href;
                  trackAcquisitionEvent("cta_click", {
                    eventName: card.href === "/visualize" && showGuestTrial ? "home_intent_trial" : "home_intent_tool",
                    targetUrl,
                  });
                }}
                className={`group rounded-2xl border p-5 text-right transition-all hover:-translate-y-1 hover:shadow-lg ${card.surface}`}
              >
                <h3 className="text-lg font-semibold leading-snug text-gray-950">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-500">{card.description}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-950">
                  {card.cta}
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 text-center">
            <p className="mb-2 text-sm font-semibold text-gray-400">מדריכים לפי חיפוש</p>
            <h2 className="text-2xl font-semibold text-gray-900 md:text-3xl">
              שאלות שאנשים מחפשים לפני שיפוץ
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {seoTopicLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-white hover:text-gray-950"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {showGuestTrial && (
        <div data-home-sticky-trial className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] backdrop-blur md:hidden" dir="rtl">
          <Link
            href="/visualize?trial=home_sticky"
            onClick={() =>
              trackAcquisitionEvent("cta_click", {
                eventName: "home_mobile_sticky_trial",
                targetUrl: "/visualize?trial=home_sticky",
              })
            }
            className="mx-auto flex h-12 max-w-sm items-center justify-center gap-2 rounded-full bg-gray-950 px-5 text-sm font-semibold text-white"
          >
            נסו הדמיה ראשונה בחינם
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="mt-1 text-center text-[11px] font-medium text-gray-500">
            בלי כרטיס אשראי · {SIGNUP_BONUS_CREDITS} קרדיטים בהרשמה
          </p>
        </div>
      )}

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
              טווחי מחיר ישראליים
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full shadow-sm shadow-green-500/50 animate-pulse"></span>
              שומר על מבנה החדר
            </span>
          </div>
        </div>
      </section>

      {/* Pricing - hide for users with subscription */}
      {!isPremium && (
      <section className="py-24 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900">תוכניות ומחירים</h2>
          <p className="text-gray-500 mb-12">התחילו בחינם - שדרגו כשתרצו</p>
          
          <PricingComparison isLoggedIn={isLoggedIn} />
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
                  בנינו את <span className="font-semibold">ShiputzAI</span> כי רצינו לראות את הבית החדש - לפני שמתחילים.
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
                  נבנה בישראל, בעברית, עם מחירי שוק ישראליים. אם יש לכם רעיון לשיפור - נשמח לשמוע.
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
              answer={creditFaqText}
            />
            <FaqItem 
              question="אפשר לנסות בלי להירשם?"
              answer="כן! לחצו 'נסו הדמיה עכשיו' ותעלו תמונה. תקבלו תוצאה מלאה כאורח. בשביל לשמור תוצאות ולקבל יותר קרדיטים - תירשמו בחינם."
            />
            <FaqItem 
              question="מה קורה עם התמונות שאני מעלה?"
              answer="התמונות מעובדות ב-AI ונשמרות בחשבון שלכם בלבד. אנחנו לא משתמשים בהן לאימון מודלים, לא משתפים עם צדדים שלישיים, ולא מציגים אותן באתר. אתם הבעלים."
            />
            <FaqItem 
              question="איך ההדמיה עובדת?"
              answer="מעלים תמונה של חדר + כותבים מה רוצים לשנות (למשל 'סלון מודרני עם ספה אפורה'). ה-AI יוצר תמונה חדשה של אותו חדר בדיוק - אחרי השינוי. תוך 30 שניות."
            />
            <FaqItem 
              question="מתאים גם למעצבי פנים?"
              answer="בהחלט. מעצבים משתמשים בהדמיות כדי להציג ללקוחות לפני שמתחילים, ב-Style Match כדי לזהות סגנונות, וב-Shop the Look למציאת מוצרים. חוסך שעות עבודה."
            />
            <FaqItem 
              question="כמה עולה הדמיית שיפוץ?"
              answer={visualizationCostText}
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
      <section className="py-16 px-6 bg-[#eef8f4]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">הזמינו חבר - שניכם מרוויחים</h2>
          <p className="text-gray-600 mb-6">שתפו את הלינק שלכם עם חברים ועמיתים. על כל חבר שנרשם - <strong>שניכם מקבלים 20 קרדיטים חינם</strong>.</p>
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
          {"@type": "Question", "name": "מה זה קרדיט ולמה צריך אותו?", "acceptedAnswer": {"@type": "Answer", "text": creditFaqText}},
          {"@type": "Question", "name": "אפשר לנסות בלי להירשם?", "acceptedAnswer": {"@type": "Answer", "text": "כן! לחצו 'נסו הדמיה עכשיו' ותעלו תמונה. תקבלו תוצאה מלאה כאורח. בשביל לשמור תוצאות ולקבל יותר קרדיטים - תירשמו בחינם."}},
          {"@type": "Question", "name": "מה קורה עם התמונות שאני מעלה?", "acceptedAnswer": {"@type": "Answer", "text": "התמונות מעובדות ב-AI ונשמרות בחשבון שלכם בלבד. אנחנו לא משתמשים בהן לאימון מודלים, לא משתפים עם צדדים שלישיים, ולא מציגים אותן באתר. אתם הבעלים."}},
          {"@type": "Question", "name": "איך ההדמיה עובדת?", "acceptedAnswer": {"@type": "Answer", "text": "מעלים תמונה של חדר + כותבים מה רוצים לשנות. ה-AI יוצר תמונה חדשה של אותו חדר בדיוק - אחרי השינוי. תוך 30 שניות."}},
          {"@type": "Question", "name": "מתאים גם למעצבי פנים?", "acceptedAnswer": {"@type": "Answer", "text": "בהחלט. מעצבים משתמשים בהדמיות כדי להציג ללקוחות לפני שמתחילים, ב-Style Match כדי לזהות סגנונות, וב-Shop the Look למציאת מוצרים. חוסך שעות עבודה."}},
          {"@type": "Question", "name": "כמה עולה הדמיית שיפוץ?", "acceptedAnswer": {"@type": "Answer", "text": visualizationCostText}},
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
