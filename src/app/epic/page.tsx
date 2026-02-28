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
    <div className="bg-black text-white min-h-screen overflow-x-hidden" dir="rtl">
      {/* Floating Navbar */}
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
        }`}
      >
        <div className="flex items-center gap-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-2 py-2 shadow-2xl">
          <Link href="/" className="flex items-center gap-2 px-4 py-1.5 text-white font-bold text-sm">
            <span className="text-lg">🏗️</span>
            ShiputzAI
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="#features">יתרונות</NavLink>
            <NavLink href="#how">איך זה עובד</NavLink>
            <NavLink href="/tips">מדריכים</NavLink>
            <NavLink href="#pricing">מחירים</NavLink>
          </div>
          <Link
            href="/signup"
            className="bg-white text-black px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors mr-1"
          >
            התחל חינם
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax */}
        <div
          className="absolute inset-0 scale-110"
          style={{ transform: `scale(1.1) translateY(${scrollY * 0.3}px)` }}
        >
          <Image
            src="/hero-epic.jpg"
            alt="שיפוץ בית ים תיכוני"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8 transition-all duration-1000 delay-300 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">חדש</span>
            <span className="text-white/80 text-sm">הדמיות AI לשיפוץ הבית שלך</span>
          </div>

          {/* Main Headline */}
          <h1
            className={`text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 transition-all duration-1000 delay-500 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <span className="text-white">השיפוץ שלך.</span>
            <br />
            <span className="bg-gradient-to-l from-amber-300 via-orange-400 to-rose-400 bg-clip-text text-transparent">
              בשליטה מלאה.
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-1000 delay-700 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            בינה מלאכותית שעוזרת לך לנהל תקציב, לסרוק קבלות, לנתח הצעות מחיר
            ולדמיין את הבית החדש שלך — לפני שמתחילים לשבור קירות.
          </p>

          {/* CTA Buttons */}
          <div
            className={`flex items-center justify-center gap-4 transition-all duration-1000 delay-900 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <Link
              href="/signup"
              className="group bg-white text-black px-8 py-3.5 rounded-full font-bold text-lg hover:bg-gray-100 transition-all hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5"
            >
              התחל בחינם
              <span className="inline-block mr-2 group-hover:mr-3 transition-all">←</span>
            </Link>
            <Link
              href="#how"
              className="text-white/70 hover:text-white px-6 py-3.5 font-medium transition-colors text-lg"
            >
              איך זה עובד?
            </Link>
          </div>
        </div>

        {/* Bottom Logos */}
        <div
          className={`absolute bottom-8 left-0 right-0 transition-all duration-1000 delay-1100 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-center gap-8 md:gap-16 px-6">
            <span className="text-white/30 text-xs">משתמשים כבר בשירות:</span>
            <div className="flex items-center gap-8 md:gap-12 text-white/30">
              <span className="text-sm md:text-base font-semibold tracking-wider">🏠 500+ משפחות</span>
              <span className="text-sm md:text-base font-semibold tracking-wider">📊 ₪50M+ נוהל</span>
              <span className="hidden md:block text-sm md:text-base font-semibold tracking-wider">⭐ 4.9/5 דירוג</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1.5 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">הכל במקום אחד</h2>
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              כל הכלים שצריך כדי לשפץ בלי הפתעות
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
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
              title="צ׳אט תמיכה"
              description="יועץ שיפוצים אישי שזמין 24/7. שאלו כל שאלה וקבלו תשובה מיידית."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-32 px-6 bg-black relative">
        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">3 צעדים פשוטים</h2>
            <p className="text-white/50 text-lg">מההרשמה ועד שיפוץ מנוהל</p>
          </div>

          <div className="space-y-16">
            <StepCard
              number="01"
              title="נרשמים ומגדירים פרויקט"
              description="הרשמה חינמית, הגדרת תקציב, ובחירת חדרים לשיפוץ. תוך דקה אתם בפנים."
            />
            <StepCard
              number="02"
              title="מעלים קבלות והצעות מחיר"
              description="פשוט מצלמים — ה-AI סורק, מנתח, ומסדר הכל אוטומטית בפרויקט שלכם."
            />
            <StepCard
              number="03"
              title="מקבלים שליטה מלאה"
              description="תקציב מעודכן, התראות חכמות, הדמיות AI, וכל הכלים לשיפוץ בלי הפתעות."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/hero-epic.jpg"
            alt=""
            fill
            className="object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
        </div>
        <div className="relative text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">מוכנים לשפץ בשליטה?</h2>
          <p className="text-white/60 text-lg mb-10">
            הצטרפו ל-500+ משפחות שכבר משפצות עם ShiputzAI
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-black px-10 py-4 rounded-full font-bold text-xl hover:bg-gray-100 transition-all hover:shadow-2xl hover:shadow-white/20 hover:-translate-y-1"
          >
            התחל בחינם ←
          </Link>
          <p className="text-white/30 text-sm mt-4">ללא כרטיס אשראי • ללא התחייבות</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white/50">
            <span className="text-lg">🏗️</span>
            <span className="font-bold text-white">ShiputzAI</span>
            <span className="text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-white/40 text-sm">
            <Link href="/terms" className="hover:text-white transition-colors">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">פרטיות</Link>
            <Link href="/contact" className="hover:text-white transition-colors">צור קשר</Link>
            <Link href="/tips" className="hover:text-white transition-colors">מדריכים</Link>
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
      className="text-white/70 hover:text-white px-3 py-1.5 text-sm transition-colors rounded-full hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-1">
      <span className="text-4xl mb-4 block">{icon}</span>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-white/50 leading-relaxed">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-8">
      <div className="text-5xl md:text-7xl font-black text-white/10 shrink-0 leading-none">
        {number}
      </div>
      <div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-white/50 text-lg leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
