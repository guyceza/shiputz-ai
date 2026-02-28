"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function EpicHomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen overflow-x-hidden" dir="rtl">
      {/* Floating Navbar - minimal pill */}
      <nav
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
        }`}
      >
        <div className="flex items-center gap-1 bg-black/30 backdrop-blur-2xl border border-white/10 rounded-full px-1.5 py-1.5 shadow-2xl">
          <Link href="/" className="flex items-center gap-1.5 px-3 py-1 text-white/90 font-semibold text-xs tracking-wide">
            ShiputzAI
          </Link>
          <div className="hidden md:flex items-center">
            <NavLink href="#features">יתרונות</NavLink>
            <NavLink href="#how">איך זה עובד</NavLink>
            <NavLink href="/tips">מדריכים</NavLink>
            <NavLink href="#pricing">מחירים</NavLink>
          </div>
          <Link
            href="/signup"
            className="bg-white/90 text-black px-4 py-1 rounded-full text-xs font-semibold hover:bg-white transition-colors"
          >
            התחל חינם
          </Link>
        </div>
      </nav>

      {/* Hero Section - Full Viewport */}
      <section className="relative h-[100svh] w-full overflow-hidden">
        {/* Background Image - truly full cover */}
        <div
          className="absolute inset-0"
          style={{ transform: `translateY(${scrollY * 0.15}px)` }}
        >
          <Image
            src="/hero-epic.jpg"
            alt="שיפוץ בית ים תיכוני"
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
          />
        </div>

        {/* Gradient overlays - heavier at bottom for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/95 to-transparent" />

        {/* Content - positioned bottom-right (RTL) */}
        <div className="absolute bottom-0 left-0 right-0 pb-28 md:pb-32 px-6 md:px-16">
          <div className="max-w-5xl mr-0 md:mr-8">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 bg-white/8 backdrop-blur-md border border-white/15 rounded-full px-3 py-1 mb-5 transition-all duration-1000 delay-300 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">חדש</span>
              <span className="text-white/60 text-xs">הדמיות AI לשיפוץ הבית שלך</span>
            </div>

            {/* Main Headline - large, left-aligned in RTL = right */}
            <h1
              className={`transition-all duration-1000 delay-500 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <span className="block text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight text-white">
                השיפוץ שלך.
              </span>
              <span className="block text-[clamp(2.5rem,8vw,5.5rem)] font-extrabold leading-[0.95] tracking-tight bg-gradient-to-l from-amber-200 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                בשליטה מלאה.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-sm md:text-base text-white/50 max-w-md mt-5 mb-7 leading-relaxed transition-all duration-1000 delay-700 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              בינה מלאכותית לניהול שיפוצים — מעקב תקציב, סריקת קבלות, 
              ניתוח הצעות מחיר והדמיות AI. לפני שמתחילים לשבור קירות.
            </p>

            {/* CTA Buttons - subtle, small */}
            <div
              className={`flex items-center gap-4 transition-all duration-1000 delay-900 ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <Link
                href="/signup"
                className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-all"
              >
                התחל בחינם
              </Link>
              <Link
                href="#how"
                className="text-white/50 hover:text-white/80 text-sm font-medium transition-colors"
              >
                למד עוד
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom stats bar */}
        <div
          className={`absolute bottom-6 left-0 right-0 px-6 md:px-16 transition-all duration-1000 delay-1200 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-6 md:gap-10 text-white/25 text-[11px] md:text-xs">
            <span>משתמשים כבר בשירות:</span>
            <span className="font-medium">500+ משפחות</span>
            <span className="font-medium hidden sm:inline">₪50M+ נוהל</span>
            <span className="font-medium hidden md:inline">⭐ 4.9/5 דירוג</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 md:py-36 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">הכל במקום אחד.</h2>
            <p className="text-white/40 text-base md:text-lg max-w-lg mx-auto">
              כל הכלים שצריך כדי לשפץ בלי הפתעות
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon="📊"
              title="מעקב תקציב"
              description="ראו בדיוק כמה הוצאתם, על מה, ומתי. התראות אוטומטיות כשמתקרבים לגבול."
            />
            <FeatureCard
              icon="📸"
              title="סריקת קבלות"
              description="צלמו קבלה, ה-AI קורא ומוסיף לרשימה. סכום, תאריך, קטגוריה — אוטומטי."
            />
            <FeatureCard
              icon="📋"
              title="ניתוח הצעות מחיר"
              description="העלו הצעת מחיר ותקבלו ניתוח מיידי. האם המחיר הוגן? מה חסר?"
            />
            <FeatureCard
              icon="🎨"
              title="הדמיות AI"
              description="העלו תמונה של החדר ותראו איך הוא ייראה אחרי שיפוץ. בלי לשבור קיר אחד."
            />
            <FeatureCard
              icon="🛋️"
              title="Shop the Look"
              description="ראיתם חדר שאהבתם? ה-AI יזהה את הפריטים ויראה לכם איפה לקנות."
            />
            <FeatureCard
              icon="💬"
              title="יועץ שיפוצים AI"
              description="יועץ שיפוצים אישי שזמין 24/7. שאלו כל שאלה וקבלו תשובה מיידית."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-28 md:py-36 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">3 צעדים.</h2>
            <p className="text-white/40 text-base md:text-lg">מהרשמה ועד שיפוץ מנוהל</p>
          </div>

          <div className="space-y-20">
            <StepCard
              number="01"
              title="נרשמים ומגדירים פרויקט"
              description="הרשמה חינמית, הגדרת תקציב ובחירת חדרים לשיפוץ. תוך דקה אתם בפנים."
            />
            <StepCard
              number="02"
              title="מעלים קבלות והצעות מחיר"
              description="פשוט מצלמים — ה-AI סורק, מנתח ומסדר הכל אוטומטית בפרויקט שלכם."
            />
            <StepCard
              number="03"
              title="שליטה מלאה"
              description="תקציב מעודכן, התראות חכמות, הדמיות AI וכל הכלים לשיפוץ מושלם."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="pricing" className="py-28 md:py-36 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-epic.jpg" alt="" fill className="object-cover opacity-10 blur-md" />
          <div className="absolute inset-0 bg-black/80" />
        </div>
        <div className="relative text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-5">מוכנים לשפץ בשליטה?</h2>
          <p className="text-white/40 text-base md:text-lg mb-10">
            הצטרפו ל-500+ משפחות שכבר משפצות חכם
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-black px-8 py-3 rounded-full font-semibold text-base hover:bg-white/90 transition-all"
          >
            התחל בחינם
          </Link>
          <p className="text-white/20 text-xs mt-4">ללא כרטיס אשראי • ללא התחייבות</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <span className="font-semibold text-white/50">ShiputzAI</span>
            <span>© 2026</span>
          </div>
          <div className="flex items-center gap-5 text-white/25 text-xs">
            <Link href="/terms" className="hover:text-white/60 transition-colors">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">פרטיות</Link>
            <Link href="/contact" className="hover:text-white/60 transition-colors">צור קשר</Link>
            <Link href="/tips" className="hover:text-white/60 transition-colors">מדריכים</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-white/50 hover:text-white/90 px-2.5 py-1 text-xs transition-colors"
    >
      {children}
    </Link>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group p-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all duration-500">
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-lg font-semibold mb-2 text-white/90">{title}</h3>
      <p className="text-white/35 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-6 md:gap-10">
      <div className="text-5xl md:text-7xl font-black text-white/[0.06] shrink-0 leading-none select-none">
        {number}
      </div>
      <div className="pt-2">
        <h3 className="text-xl md:text-2xl font-bold mb-2 text-white/90">{title}</h3>
        <p className="text-white/35 text-sm md:text-base leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
