"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function EpicHomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Delay to ensure smooth entry animation
    const timer = setTimeout(() => setIsLoaded(true), 100);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="bg-[#060608] text-white min-h-screen overflow-x-hidden" dir="rtl">
      {/* Noise Texture Overlay - site wide */}
      <div
        className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />

      {/* Floating Navbar */}
      <nav
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-[1.5s] ease-out ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
        }`}
        style={{ transitionDelay: "0.2s" }}
      >
        <div className="flex items-center gap-0.5 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.08] rounded-full px-1 py-1">
          <Link href="/" className="px-3.5 py-1.5 text-white/80 font-medium text-[13px] tracking-wide">
            ShiputzAI
          </Link>
          <div className="hidden md:flex items-center">
            <NavLink href="#features">יתרונות</NavLink>
            <span className="text-white/15 text-xs">·</span>
            <NavLink href="#how">איך זה עובד</NavLink>
            <span className="text-white/15 text-xs">·</span>
            <NavLink href="/tips">מדריכים</NavLink>
            <span className="text-white/15 text-xs">·</span>
            <NavLink href="#pricing">מחירים</NavLink>
          </div>
          <Link
            href="/signup"
            className="bg-white/90 text-black/90 px-4 py-1 rounded-full text-[12px] font-medium hover:bg-white transition-all duration-300"
          >
            התחל חינם
          </Link>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative h-[100svh] w-full overflow-hidden">
        {/* Background Image with slow zoom */}
        <div
          className={`absolute inset-0 transition-transform duration-[2s] ease-out ${
            isLoaded ? "scale-100" : "scale-110"
          }`}
          style={{ transform: `scale(${isLoaded ? 1 + scrollY * 0.0002 : 1.1})` }}
        >
          <Image
            src="/hero-epic.jpg"
            alt="שיפוץ בית ים תיכוני"
            fill
            className="object-cover object-center"
            priority
            quality={95}
            sizes="100vw"
          />
        </div>

        {/* Multi-layer gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/30 to-[#060608]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#060608]/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-[#060608] to-transparent" />

        {/* Vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(6,6,8,0.6) 100%)",
          }}
        />

        {/* Subtle lens flare / light bleed */}
        <div
          className={`absolute top-[30%] right-[40%] w-[500px] h-[500px] rounded-full transition-opacity duration-[3s] ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "radial-gradient(circle, rgba(255,180,100,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        {/* Content - bottom right aligned */}
        <div className="absolute bottom-0 left-0 right-0 pb-24 md:pb-28 px-7 md:px-16 lg:px-24">
          <div className="max-w-3xl">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl rounded-full px-3 py-1 mb-6 transition-all duration-[1.5s] ease-out ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: "0.6s" }}
            >
              <span className="bg-emerald-500/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">חדש</span>
              <span className="text-white/40 text-[11px]">הדמיות AI לשיפוץ הבית שלך</span>
            </div>

            {/* Main Headline with glow */}
            <h1
              className={`transition-all duration-[1.5s] ease-out ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: "0.8s" }}
            >
              <span
                className="block text-[clamp(2.2rem,7.5vw,5rem)] font-extralight leading-[1.05] tracking-[-0.02em] text-white/95"
                style={{ textShadow: "0 0 80px rgba(255,255,255,0.15), 0 0 30px rgba(255,255,255,0.05)" }}
              >
                השיפוץ שלך.
              </span>
              <span
                className="block text-[clamp(2.2rem,7.5vw,5rem)] font-extralight leading-[1.05] tracking-[-0.02em] bg-gradient-to-l from-amber-200/90 via-orange-200/90 to-amber-300/80 bg-clip-text text-transparent"
                style={{ textShadow: "0 0 60px rgba(251,191,36,0.2)" }}
              >
                בשליטה מלאה.
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-[13px] md:text-[15px] text-white/35 max-w-sm mt-5 mb-8 leading-[1.7] font-light transition-all duration-[1.5s] ease-out ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: "1s" }}
            >
              בינה מלאכותית לניהול שיפוצים — מעקב תקציב, סריקת קבלות,
              ניתוח הצעות מחיר והדמיות AI. לפני שמתחילים לשבור קירות.
            </p>

            {/* CTA Buttons */}
            <div
              className={`flex items-center gap-5 transition-all duration-[1.5s] ease-out ${
                isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: "1.2s" }}
            >
              <Link
                href="/signup"
                className="group bg-white/95 text-[#060608] px-6 py-2.5 rounded-full text-[13px] font-medium hover:bg-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                התחל בחינם
              </Link>
              <Link
                href="#how"
                className="text-white/30 hover:text-white/60 text-[13px] font-light transition-colors duration-300"
              >
                למד עוד
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom stats - very subtle */}
        <div
          className={`absolute bottom-7 left-0 right-0 px-7 md:px-16 lg:px-24 transition-all duration-[1.5s] ease-out ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "1.5s" }}
        >
          <div className="flex items-center gap-8 text-white/15 text-[10px] md:text-[11px] font-light tracking-wide">
            <span>משתמשים כבר בשירות</span>
            <span>500+ משפחות</span>
            <span className="hidden sm:inline">₪50M+ נוהל</span>
            <span className="hidden md:inline">4.9/5 דירוג</span>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section id="features" className="py-28 md:py-40 px-7 md:px-16 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-[3.2rem] font-extralight tracking-tight mb-4">
              הכל במקום אחד.
            </h2>
            <p className="text-white/25 text-sm font-light max-w-md mx-auto">
              כל הכלים שצריך כדי לשפץ בלי הפתעות
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            <FeatureCard icon="📊" title="מעקב תקציב" description="ראו בדיוק כמה הוצאתם, על מה, ומתי. התראות אוטומטיות כשמתקרבים לגבול." />
            <FeatureCard icon="📸" title="סריקת קבלות" description="צלמו קבלה, ה-AI קורא ומוסיף לרשימה. סכום, תאריך, קטגוריה — אוטומטי." />
            <FeatureCard icon="📋" title="ניתוח הצעות מחיר" description="העלו הצעת מחיר ותקבלו ניתוח מיידי. האם המחיר הוגן? מה חסר?" />
            <FeatureCard icon="🎨" title="הדמיות AI" description="העלו תמונה של החדר ותראו איך הוא ייראה אחרי שיפוץ. בלי לשבור קיר אחד." />
            <FeatureCard icon="🛋️" title="Shop the Look" description="ראיתם חדר שאהבתם? ה-AI יזהה את הפריטים ויראה לכם איפה לקנות." />
            <FeatureCard icon="💬" title="יועץ שיפוצים AI" description="יועץ שיפוצים אישי שזמין 24/7. שאלו כל שאלה וקבלו תשובה מיידית." />
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="py-28 md:py-40 px-7 md:px-16 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-[3.2rem] font-extralight tracking-tight mb-4">3 צעדים.</h2>
            <p className="text-white/25 text-sm font-light">מהרשמה ועד שיפוץ מנוהל</p>
          </div>

          <div className="space-y-20 md:space-y-24">
            <StepCard number="01" title="נרשמים ומגדירים פרויקט" description="הרשמה חינמית, הגדרת תקציב ובחירת חדרים לשיפוץ. תוך דקה אתם בפנים." />
            <StepCard number="02" title="מעלים קבלות והצעות מחיר" description="פשוט מצלמים — ה-AI סורק, מנתח ומסדר הכל אוטומטית בפרויקט שלכם." />
            <StepCard number="03" title="שליטה מלאה" description="תקציב מעודכן, התראות חכמות, הדמיות AI וכל הכלים לשיפוץ מושלם." />
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section id="pricing" className="py-28 md:py-40 px-7 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/hero-epic.jpg" alt="" fill className="object-cover opacity-[0.07]" style={{ filter: "blur(20px) saturate(0.5)" }} />
          <div className="absolute inset-0 bg-[#060608]/90" />
        </div>
        <div className="relative text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-[3.2rem] font-extralight tracking-tight mb-5">
            מוכנים לשפץ בשליטה?
          </h2>
          <p className="text-white/25 text-sm font-light mb-10">
            הצטרפו ל-500+ משפחות שכבר משפצות חכם
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white/95 text-[#060608] px-7 py-2.5 rounded-full text-[13px] font-medium hover:bg-white transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            התחל בחינם
          </Link>
          <p className="text-white/15 text-[11px] mt-4 font-light">ללא כרטיס אשראי · ללא התחייבות</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-7 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-white/20 text-[11px] font-light">ShiputzAI © 2026</span>
          <div className="flex items-center gap-5 text-white/15 text-[11px] font-light">
            <Link href="/terms" className="hover:text-white/40 transition-colors">תנאי שימוש</Link>
            <Link href="/privacy" className="hover:text-white/40 transition-colors">פרטיות</Link>
            <Link href="/contact" className="hover:text-white/40 transition-colors">צור קשר</Link>
            <Link href="/tips" className="hover:text-white/40 transition-colors">מדריכים</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-white/40 hover:text-white/80 px-2.5 py-1 text-[12px] font-light transition-colors duration-300">
      {children}
    </Link>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-white/[0.04] bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-500">
      <span className="text-2xl mb-3.5 block opacity-80">{icon}</span>
      <h3 className="text-[15px] font-medium mb-1.5 text-white/80">{title}</h3>
      <p className="text-white/25 text-[13px] leading-[1.7] font-light">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-6 md:gap-10">
      <div className="text-[4rem] md:text-[5.5rem] font-extralight text-white/[0.04] shrink-0 leading-none select-none tracking-tighter">
        {number}
      </div>
      <div className="pt-3 md:pt-5">
        <h3 className="text-lg md:text-xl font-light mb-2 text-white/80">{title}</h3>
        <p className="text-white/25 text-[13px] md:text-sm leading-[1.7] font-light">{description}</p>
      </div>
    </div>
  );
}
