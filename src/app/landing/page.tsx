"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

/* ─── Animated Grid Background ─── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0" style={{
        backgroundImage: `linear-gradient(rgba(69,128,247,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(69,128,247,0.03) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }} />
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(69,128,247,0.08) 0%, transparent 70%)"
      }} />
    </div>
  );
}

/* ─── Floating Orbs ─── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{ y: [0, -30, 0], x: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] right-[10%] w-[500px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(69,128,247,0.07) 0%, transparent 60%)" }}
      />
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[40%] left-[5%] w-[400px] h-[400px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 60%)" }}
      />
      <motion.div
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-[10%] right-[20%] w-[350px] h-[350px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 60%)" }}
      />
    </div>
  );
}

/* ─── Reveal Animation ─── */
function Reveal({ children, delay = 0, className = "", direction = "up" }: { 
  children: React.ReactNode; delay?: number; className?: string; direction?: "up" | "down" | "left" | "right" 
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  };
  const d = directions[direction];
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: d.y, x: d.x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >{children}</motion.div>
  );
}

/* ─── Animated Counter ─── */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

/* ─── Parallax Image ─── */
function ParallaxImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      <Image src={src} alt={alt} width={600} height={400} className="w-full h-auto" />
    </motion.div>
  );
}

/* ─── Magnetic Button ─── */
function MagneticButton({ children, className = "", href = "/" }: { children: React.ReactNode; className?: string; href?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  return (
    <motion.a
      ref={ref}
      href={href}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
        y.set((e.clientY - rect.top - rect.height / 2) * 0.15);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
    >
      {children}
    </motion.a>
  );
}

/* ─── Glow Card ─── */
function GlowCard({ children, className = "", accentColor = "69,128,247" }: { children: React.ReactNode; className?: string; accentColor?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, transition: { duration: 0.3 } }}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: isHovered 
          ? `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${accentColor},0.06), transparent 40%)`
          : undefined,
      }}
    >
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(${accentColor},0.15), transparent 40%)`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          padding: "1px",
          borderRadius: "16px",
        }}
      />
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*                     MAIN PAGE                              */
/* ═══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroImgScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroTextOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroTextY = useTransform(scrollYProgress, [0, 0.4], [0, -50]);
  
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div dir="rtl" className="min-h-screen" style={{ fontFamily: "'Heebo', -apple-system, sans-serif", background: "#050917", color: "#fff" }}>
      
      {/* ===== NAV ===== */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(5,9,23,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
        }}>
        <div className="max-w-[1200px] mx-auto px-8 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo-no-bg.png" alt="ShiputzAI" width={36} height={36} className="rounded-xl transition-transform group-hover:scale-110" />
            <span className="text-[22px] font-extrabold tracking-tight">
              Shiputz<span className="bg-gradient-to-r from-[#4580f7] to-[#06b6d4] bg-clip-text text-transparent">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:block text-[15px] font-medium text-white/40 hover:text-white transition-colors duration-300">יכולות</a>
            <a href="#how" className="hidden md:block text-[15px] font-medium text-white/40 hover:text-white transition-colors duration-300">איך זה עובד</a>
            <a href="#pricing" className="hidden md:block text-[15px] font-medium text-white/40 hover:text-white transition-colors duration-300">מחירים</a>
            <MagneticButton href="/"
              className="relative bg-gradient-to-r from-[#4580f7] to-[#3b6de8] text-white text-[14px] font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_4px_20px_rgba(69,128,247,0.3)] overflow-hidden group">
              <span className="relative z-10">התחל בחינם</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#3b6de8] to-[#4580f7] opacity-0 group-hover:opacity-100 transition-opacity" />
            </MagneticButton>
          </div>
        </div>
      </motion.nav>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative min-h-screen overflow-hidden pt-[140px] pb-[80px]">
        <GridBackground />
        <FloatingOrbs />
        
        {/* Big hero glow */}
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120vw] h-[60vh] pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 80% at 50% 20%, rgba(69,128,247,0.12) 0%, transparent 70%)" }} />

        <motion.div style={{ opacity: heroTextOpacity, y: heroTextY }} className="relative z-10 text-center px-8 max-w-[860px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-[13px] font-semibold mb-8"
            style={{
              background: "rgba(69,128,247,0.1)",
              border: "1px solid rgba(69,128,247,0.2)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#4580f7] animate-pulse" />
            <span className="text-[#8ab4ff]">מופעל בינה מלאכותית</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(40px,5.5vw,72px)] font-black leading-[1.05] tracking-[-0.03em] mb-6"
          >
            השיפוץ שלך.{" "}
            <span className="bg-gradient-to-r from-[#4580f7] via-[#06b6d4] to-[#8b5cf6] bg-clip-text text-transparent">
              חכם יותר.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="text-[19px] text-white/50 leading-[1.7] max-w-[560px] mx-auto mb-10"
          >
            העלו תמונה של החדר — קבלו הדמיית שיפוץ, כתב כמויות מפורט, וניתוח הצעות מחיר. הכל אוטומטי עם AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="flex gap-4 justify-center flex-wrap mb-16"
          >
            <MagneticButton href="/"
              className="relative bg-white text-[#050917] text-[16px] font-bold px-8 py-4 rounded-xl transition-all hover:shadow-[0_8px_30px_rgba(255,255,255,0.1)] group overflow-hidden">
              <span className="relative z-10">התחל בחינם ←</span>
            </MagneticButton>
            <a href="#how"
              className="text-white/70 hover:text-white text-[16px] font-semibold px-8 py-4 rounded-xl transition-all"
              style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)" }}>
              איך זה עובד?
            </a>
          </motion.div>

          {/* Logo Trust Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <p className="text-[11px] uppercase tracking-[3px] text-white/25 font-semibold mb-5">
              קישורים לחנויות המובילות
            </p>
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {["ikea", "homecenter", "ace", "foxhome", "aminach", "tambur"].map((logo, i) => (
                <motion.div key={logo} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 + i * 0.1 }}>
                  <Image src={`/logos/${logo}.png`} alt={logo} width={80} height={24} className="h-5 w-auto brightness-0 invert opacity-30 hover:opacity-60 transition-opacity duration-500" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Hero Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: heroImgY, scale: heroImgScale }}
          className="relative max-w-[1060px] mx-auto px-8 mt-8"
        >
          {/* Glow behind screenshot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full blur-[80px]"
            style={{ background: "rgba(69,128,247,0.08)" }} />
          <div className="relative rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
            }}>
            <Image src="/ads/screenshot-home-landscape.png" alt="ShiputzAI" width={1200} height={700} className="w-full h-auto" priority />
            {/* Bottom gradient fade */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050917]" />
          </div>
        </motion.div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-24 px-8 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { target: 63, suffix: "%", label: "מהיר מעיצוב ידני" },
            { target: 127, suffix: "+", label: "בעלי מקצוע משתמשים" },
            { target: 8, suffix: "", label: "כלי AI במקום אחד" },
            { target: 99, prefix: "₪", suffix: "", label: "חד פעמי — בלי מנוי" },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="text-[48px] font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                <Counter target={s.target} suffix={s.suffix} prefix={s.prefix || ""} />
              </div>
              <div className="text-[14px] text-white/35 font-medium mt-1">{s.label}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="pt-[160px] pb-[80px] px-8 relative">
        <FloatingOrbs />
        
        <Reveal className="text-center mb-24">
          <h2 className="text-[clamp(32px,4vw,52px)] font-black tracking-[-0.02em] mb-4">
            הכלים ש
            <span className="bg-gradient-to-r from-[#4580f7] to-[#06b6d4] bg-clip-text text-transparent">ישנו</span>
            {" "}לך את השיפוץ
          </h2>
          <p className="text-[18px] text-white/40 max-w-[500px] mx-auto">
            כל מה שצריך כדי לתכנן, לדמיין ולחסוך
          </p>
        </Reveal>

        {/* Feature 1: AI Visualize */}
        <div className="max-w-[1100px] mx-auto mb-[160px]">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#4580f7] mb-5 py-1 px-3 rounded-full"
                style={{ background: "rgba(69,128,247,0.1)", border: "1px solid rgba(69,128,247,0.15)" }}>
                הדמיות AI
              </span>
              <h3 className="text-[32px] font-extrabold leading-[1.2] mb-5">
                העלה תמונה. קבל הדמיית שיפוץ{" "}
                <span className="text-[#4580f7]">תוך שניות.</span>
              </h3>
              <p className="text-[17px] text-white/45 leading-[1.8] mb-8">
                ה-AI מנתח את החדר שלך ומייצר הדמיה ריאליסטית של איך הוא ייראה אחרי השיפוץ. בחר סגנון, שנה צבעים, הוסף רהיטים — בלחיצה.
              </p>
              <Link href="/visualize" className="inline-flex items-center gap-2 text-[#4580f7] font-bold text-[15px] hover:gap-3 transition-all group">
                נסו עכשיו 
                <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="grid grid-cols-2 gap-3 relative">
                <div className="absolute -inset-8 rounded-3xl blur-[60px] pointer-events-none"
                  style={{ background: "rgba(69,128,247,0.06)" }} />
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                  <Image src="/examples/kitchen-before.jpg" alt="לפני" width={400} height={300} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 right-3 text-[10px] font-bold bg-black/60 text-white px-3 py-1 rounded-lg backdrop-blur-sm border border-white/10">לפני</span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                  <Image src="/examples/kitchen-after.jpg" alt="אחרי" width={400} height={300} className="w-full h-full object-cover" />
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold bg-[#4580f7]/80 text-white px-3 py-1 rounded-lg backdrop-blur-sm">אחרי ✨</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Feature 2: Style Matcher */}
        <div className="max-w-[1100px] mx-auto mb-[160px]">
          <div className="grid md:grid-cols-2 gap-20 items-center" dir="ltr">
            <Reveal delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-8 rounded-3xl blur-[60px] pointer-events-none"
                  style={{ background: "rgba(124,58,237,0.06)" }} />
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_25px_60px_rgba(0,0,0,0.4)] hover:border-white/[0.1] transition-colors duration-500">
                  <Image src="/images/ai-vision/style-match-showcase.jpg" alt="Style Matcher" width={600} height={400} className="w-full h-auto" />
                </div>
              </div>
            </Reveal>
            <Reveal className="text-right" dir="rtl">
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#8b5cf6] mb-5 py-1 px-3 rounded-full"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.15)" }}>
                STYLE MATCHER
              </span>
              <h3 className="text-[32px] font-extrabold leading-[1.2] mb-5">
                זיהוי סגנון + רשימת קניות{" "}
                <span className="text-[#8b5cf6]">מוכנה</span>
              </h3>
              <p className="text-[17px] text-white/45 leading-[1.8] mb-8">
                העלו תמונה של חדר שאהבתם — ה-AI מזהה את סגנון העיצוב, מפרט את כל המוצרים ומציע לינקים ישירים לקנייה.
              </p>
              <Link href="/style-match" className="inline-flex items-center gap-2 text-[#8b5cf6] font-bold text-[15px] hover:gap-3 transition-all group">
                נסו עכשיו 
                <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Feature 3: Floorplan */}
        <div className="max-w-[1100px] mx-auto mb-[160px]">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#10b981] mb-5 py-1 px-3 rounded-full"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.15)" }}>
                תוכנית קומה חכמה
              </span>
              <h3 className="text-[32px] font-extrabold leading-[1.2] mb-5">
                מתוכנית אדריכלית להדמיה{" "}
                <span className="text-[#10b981]">תלת-ממדית</span>
              </h3>
              <p className="text-[17px] text-white/45 leading-[1.8] mb-8">
                העלו תוכנית קומה — ה-AI ממיר אותה להדמיה ריאליסטית. תראו איך הדירה תיראה במציאות, עוד לפני שהתחלתם.
              </p>
              <Link href="/floorplan" className="inline-flex items-center gap-2 text-[#10b981] font-bold text-[15px] hover:gap-3 transition-all group">
                נסו עכשיו 
                <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-8 rounded-3xl blur-[60px] pointer-events-none"
                  style={{ background: "rgba(16,185,129,0.06)" }} />
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_25px_60px_rgba(0,0,0,0.4)] hover:border-white/[0.1] transition-colors duration-500">
                  <Image src="/images/ai-vision/floorplan.jpg" alt="תוכנית קומה" width={600} height={400} className="w-full h-auto" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Feature 4: Video Tour */}
        <div className="max-w-[1100px] mx-auto mb-[160px]">
          <div className="grid md:grid-cols-2 gap-20 items-center" dir="ltr">
            <Reveal delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-8 rounded-3xl blur-[60px] pointer-events-none"
                  style={{ background: "rgba(225,29,72,0.06)" }} />
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_25px_60px_rgba(0,0,0,0.4)] hover:border-white/[0.1] transition-colors duration-500">
                  <Image src="/images/ai-vision/video-tour-thumb.jpg" alt="סיור וידאו" width={600} height={400} className="w-full h-auto" />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer">
                      <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-transparent border-l-[16px] border-l-white mr-[-3px]" style={{ transform: "scaleX(-1)" }} />
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal className="text-right" dir="rtl">
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#f43f5e] mb-5 py-1 px-3 rounded-full"
                style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.15)" }}>
                סיור וידאו AI
              </span>
              <h3 className="text-[32px] font-extrabold leading-[1.2] mb-5">
                הליכה וירטואלית{" "}
                <span className="text-[#f43f5e]">בדירה החדשה</span>
              </h3>
              <p className="text-[17px] text-white/45 leading-[1.8] mb-8">
                סרטון AI שמדמה הליכה אמיתית בתוך ההדמיה. שתפו עם בן/בת הזוג, המעצב או הקבלן.
              </p>
              <Link href="/floorplan?mode=video" className="inline-flex items-center gap-2 text-[#f43f5e] font-bold text-[15px] hover:gap-3 transition-all group">
                צרו סרטון 
                <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
              </Link>
            </Reveal>
          </div>
        </div>

        {/* Feature 5: Shop the Look */}
        <div className="max-w-[1100px] mx-auto mb-[60px]">
          <div className="grid md:grid-cols-2 gap-20 items-center">
            <Reveal>
              <span className="inline-block text-[12px] font-bold uppercase tracking-[2px] text-[#f59e0b] mb-5 py-1 px-3 rounded-full"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.15)" }}>
                SHOP THE LOOK
              </span>
              <h3 className="text-[32px] font-extrabold leading-[1.2] mb-5">
                ראית עיצוב שאהבת?{" "}
                <span className="text-[#f59e0b]">קנה אותו.</span>
              </h3>
              <p className="text-[17px] text-white/45 leading-[1.8] mb-8">
                העלו תמונת השראה — ה-AI מזהה כל מוצר עם קישורים ישירים לרכישה בחנויות ישראליות.
              </p>
              <Link href="/shop-the-look" className="inline-flex items-center gap-2 text-[#f59e0b] font-bold text-[15px] hover:gap-3 transition-all group">
                נסו עכשיו 
                <span className="group-hover:translate-x-[-4px] transition-transform">←</span>
              </Link>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="relative">
                <div className="absolute -inset-8 rounded-3xl blur-[60px] pointer-events-none"
                  style={{ background: "rgba(245,158,11,0.06)" }} />
                <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] shadow-[0_25px_60px_rgba(0,0,0,0.4)] hover:border-white/[0.1] transition-colors duration-500">
                  <Image src="/images/ai-vision/shop-look.jpg" alt="Shop the Look" width={600} height={400} className="w-full h-auto" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ===== MORE TOOLS BENTO ===== */}
      <section className="py-[140px] px-8 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(6,182,212,0.04) 0%, transparent 70%)" }} />
        
        <Reveal className="text-center mb-16">
          <h2 className="text-[40px] font-black tracking-[-0.02em] mb-3">
            ועוד כלים{" "}
            <span className="bg-gradient-to-r from-[#06b6d4] to-[#10b981] bg-clip-text text-transparent">בארגז</span>
          </h2>
        </Reveal>

        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-5">
          {[
            { title: "כתב כמויות", desc: "צלמו את החדר וקבלו פירוט מלא — ריצוף, צבע, חשמל, אינסטלציה.", img: "/features/feature-budget.png", accent: "6,182,212" },
            { title: "ניתוח הצעות מחיר", desc: "העלו הצעת מחיר — ה-AI ישווה מול מחירי שוק ויגיד אם המחיר הוגן.", img: "/features/feature-receipt.png", accent: "16,185,129" },
            { title: "עוזר AI לשיפוץ", desc: "שאלו כל שאלה על השיפוץ וקבלו תשובה מיידית.", img: "/images/ai-vision/chat-support-thumb.jpg", accent: "139,92,246" },
          ].map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <GlowCard accentColor={f.accent}
                className="rounded-2xl overflow-hidden border border-white/[0.06] h-full"
                style={{ background: "rgba(255,255,255,0.02)" } as any}>
                <div className="h-[200px] overflow-hidden">
                  <Image src={f.img} alt={f.title} width={400} height={200}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" />
                </div>
                <div className="p-6">
                  <h4 className="text-[17px] font-bold mb-2">{f.title}</h4>
                  <p className="text-[14px] text-white/40 leading-[1.7]">{f.desc}</p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-[160px] px-8 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <Reveal className="text-center mb-20">
          <h2 className="text-[clamp(32px,4vw,52px)] font-black tracking-[-0.02em] mb-4">
            איך זה{" "}
            <span className="bg-gradient-to-r from-[#4580f7] to-[#8b5cf6] bg-clip-text text-transparent">עובד?</span>
          </h2>
          <p className="text-[18px] text-white/40">שלושה צעדים — מתמונה לתוכנית שיפוץ מלאה</p>
        </Reveal>

        <div className="max-w-[960px] mx-auto grid md:grid-cols-3 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-[56px] left-[16.67%] right-[16.67%] h-[1px]"
            style={{ background: "linear-gradient(90deg, transparent, rgba(69,128,247,0.2), rgba(139,92,246,0.2), transparent)" }} />
          
          {[
            { num: "1", title: "העלו תמונה", desc: "צלמו את החדר או העלו תמונה קיימת. ה-AI מזהה אוטומטית את המרחב.", color: "#4580f7" },
            { num: "2", title: "בחרו כלי", desc: "הדמיית שיפוץ? כתב כמויות? ניתוח מחיר? בחרו מה שמתאים.", color: "#8b5cf6" },
            { num: "3", title: "קבלו תוצאה", desc: "תוך שניות — תוצאה מקצועית לשיתוף עם הקבלן או בן/בת הזוג.", color: "#06b6d4" },
          ].map((step, i) => (
            <Reveal key={i} delay={i * 0.15}>
              <div className="relative text-center group">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-14 h-14 rounded-2xl text-white text-[22px] font-black flex items-center justify-center mx-auto mb-6 relative"
                  style={{ 
                    background: step.color,
                    boxShadow: `0 4px 20px ${step.color}40`,
                  }}>
                  {step.num}
                </motion.div>
                <h4 className="text-[19px] font-bold mb-3">{step.title}</h4>
                <p className="text-[15px] text-white/40 leading-[1.7]">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-[140px] px-8 relative" style={{ background: "rgba(255,255,255,0.01)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <Reveal className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,52px)] font-black tracking-[-0.02em] mb-4">
            מה{" "}
            <span className="bg-gradient-to-r from-[#f59e0b] to-[#f43f5e] bg-clip-text text-transparent">אומרים</span>
            {" "}עלינו
          </h2>
          <p className="text-[18px] text-white/40">בעלי מקצוע ולקוחות שכבר משתמשים</p>
        </Reveal>

        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-6">
          {[
            { text: "חסך לי שעות של עבודה. במקום לשבת עם אקסל ולחשב כמויות, פשוט צילמתי את הדירה וקיבלתי כתב כמויות מפורט תוך דקה.", name: "דניאל כ.", role: "קבלן שיפוצים, תל אביב", initial: "ד", gradient: "from-[#4580f7] to-[#06b6d4]" },
            { text: "הלקוחות שלי מתים על ההדמיות. במקום להסביר במילים איך החדר ייראה, אני מראה להם תמונה ריאליסטית. סוגר עסקאות יותר מהר.", name: "שירה ד.", role: "מעצבת פנים", initial: "ש", gradient: "from-[#8b5cf6] to-[#f43f5e]" },
            { text: "קיבלתי הצעת מחיר מקבלן והרגשתי שמשהו לא בסדר. העליתי ל-ShiputzAI וזה הראה לי שהמחיר מנופח ב-40%. חסך לי אלפי שקלים.", name: "אורן מ.", role: "בעל דירה, חיפה", initial: "א", gradient: "from-[#f59e0b] to-[#10b981]" },
          ].map((t, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <GlowCard className="rounded-2xl p-8 border border-white/[0.06] h-full flex flex-col" style={{ background: "rgba(255,255,255,0.02)" } as any}>
                <div className="text-[#f59e0b] text-[16px] mb-5 tracking-wider">★★★★★</div>
                <p className="text-[15px] text-white/50 leading-[1.8] mb-6 flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} text-white flex items-center justify-center font-bold text-[15px]`}>
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold">{t.name}</div>
                    <div className="text-[12px] text-white/35">{t.role}</div>
                  </div>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-[160px] px-8 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <Reveal className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,52px)] font-black tracking-[-0.02em] mb-4">
            מחירים{" "}
            <span className="bg-gradient-to-r from-[#10b981] to-[#4580f7] bg-clip-text text-transparent">פשוטים</span>
          </h2>
          <p className="text-[18px] text-white/40">בלי מנויים. בלי הפתעות.</p>
        </Reveal>

        <div className="max-w-[780px] mx-auto grid md:grid-cols-2 gap-6">
          {/* Free */}
          <Reveal>
            <div className="rounded-2xl p-10 border border-white/[0.06] h-full flex flex-col" style={{ background: "rgba(255,255,255,0.02)" }}>
              <h4 className="text-[20px] font-bold mb-3">חינם</h4>
              <div className="text-[48px] font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent mb-1">₪0</div>
              <div className="text-[14px] text-white/35 mb-8">לנצח</div>
              <ul className="flex-1 mb-8 space-y-0">
                {["הדמיית שיפוץ אחת", "כתב כמויות אחד", "ניתוח הצעת מחיר אחד", "תמיכה בצ׳אט"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3 text-[15px] text-white/50" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <svg className="w-4 h-4 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/"
                className="w-full text-center text-[15px] font-bold py-3.5 rounded-xl transition-all border border-white/[0.08] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.03]"
                style={{ display: "block" }}>
                התחל בחינם
              </a>
            </div>
          </Reveal>

          {/* Pro */}
          <Reveal delay={0.12}>
            <div className="relative rounded-2xl p-10 h-full flex flex-col overflow-hidden"
              style={{ 
                background: "rgba(69,128,247,0.05)",
                border: "1px solid rgba(69,128,247,0.2)",
              }}>
              {/* Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[200px] rounded-full pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(69,128,247,0.1) 0%, transparent 70%)" }} />
              
              <div className="absolute -top-[1px] right-6 bg-gradient-to-r from-[#4580f7] to-[#06b6d4] text-white text-[11px] font-bold px-4 py-1.5 rounded-b-lg">
                הכי פופולרי
              </div>
              <h4 className="text-[20px] font-bold mb-3 relative">Pro</h4>
              <div className="text-[48px] font-black bg-gradient-to-r from-[#4580f7] to-[#06b6d4] bg-clip-text text-transparent mb-1 relative">
                ₪99 <span className="text-[15px] font-medium text-white/40">חד פעמי</span>
              </div>
              <div className="text-[14px] text-white/35 mb-8 relative">4 קרדיטים לכל הכלים</div>
              <ul className="flex-1 mb-8 space-y-0 relative">
                {["4 הדמיות שיפוץ", "כתב כמויות ללא הגבלה", "ניתוח הצעות מחיר", "Shop the Look", "סריקת קבלות", "סיור וידאו AI", "תמיכה בעדיפות"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3 text-[15px] text-white/50" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <svg className="w-4 h-4 text-[#4580f7] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <MagneticButton href="/"
                className="w-full text-center bg-gradient-to-r from-[#4580f7] to-[#3b6de8] text-white text-[15px] font-bold py-3.5 rounded-xl transition-all hover:shadow-[0_4px_20px_rgba(69,128,247,0.3)] block">
                שדרג ל-Pro ←
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== BOTTOM CTA ===== */}
      <section className="py-[160px] px-8 text-center relative overflow-hidden">
        {/* Big glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(69,128,247,0.08) 0%, transparent 60%)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.05) 0%, transparent 60%)" }} />
        
        <Reveal className="relative z-10">
          <h2 className="text-[clamp(36px,4.5vw,56px)] font-black tracking-[-0.02em] mb-5">
            מוכנים לשפץ{" "}
            <span className="bg-gradient-to-r from-[#4580f7] via-[#8b5cf6] to-[#06b6d4] bg-clip-text text-transparent">חכם?</span>
          </h2>
          <p className="text-[18px] text-white/40 mb-10 max-w-[480px] mx-auto">
            הצטרפו למאות בעלי מקצוע ובעלי דירות שכבר משתמשים ב-ShiputzAI
          </p>
          <MagneticButton href="/"
            className="inline-flex bg-white text-[#050917] text-[17px] font-bold px-10 py-4 rounded-xl transition-all hover:shadow-[0_12px_40px_rgba(255,255,255,0.1)]">
            התחל בחינם — בלי כרטיס אשראי ←
          </MagneticButton>
        </Reveal>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-10 px-8 text-center text-[14px] text-white/25" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        © 2026 ShiputzAI. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
