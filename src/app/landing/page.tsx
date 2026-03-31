"use client";

import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

// Reusable animated section
function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Spotlight glow effect
function SpotlightGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-[40%] left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full"
        style={{ background: "radial-gradient(ellipse at center, rgba(69,128,247,0.08) 0%, rgba(124,58,237,0.04) 30%, transparent 70%)" }}
      />
    </div>
  );
}

// Feature images with parallax
function FeatureImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [30, -30]);
  return (
    <motion.div ref={ref} style={{ y }} className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0d1117]">
      <div className="absolute inset-0 bg-gradient-to-t from-[#050917]/60 to-transparent z-10 pointer-events-none" />
      <Image src={src} alt={alt} width={600} height={400} className="w-full h-auto" />
    </motion.div>
  );
}

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(heroScroll, [0, 1], [0, 150]);
  const heroOpacity = useTransform(heroScroll, [0, 0.5], [1, 0]);

  return (
    <div className="bg-[#050917] text-white min-h-screen" dir="rtl" style={{ fontFamily: "'Heebo', -apple-system, sans-serif" }}>

      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
        style={{ background: "rgba(5,9,23,0.8)", backdropFilter: "blur(20px) saturate(180%)", WebkitBackdropFilter: "blur(20px) saturate(180%)" }}>
        <div className="max-w-[1200px] mx-auto px-6 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-no-bg.png" alt="ShiputzAI" width={32} height={32} className="rounded-lg" />
            <span className="text-[22px] font-extrabold tracking-tight">Shiputz<span className="text-[#4580f7]">AI</span></span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#features" className="hidden md:block text-[15px] font-medium text-white/50 hover:text-white transition-colors">יכולות</a>
            <a href="#how" className="hidden md:block text-[15px] font-medium text-white/50 hover:text-white transition-colors">איך זה עובד</a>
            <a href="#pricing" className="hidden md:block text-[15px] font-medium text-white/50 hover:text-white transition-colors">מחירים</a>
            <Link href="/" className="bg-[#4580f7] hover:bg-[#3570e0] text-white text-[14px] font-bold px-5 py-2.5 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(69,128,247,0.3)]">
              התחל בחינם
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section ref={heroRef} className="relative pt-[160px] pb-[100px] overflow-hidden">
        <SpotlightGlow />
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-[#4580f7]/10 border border-[#4580f7]/20 rounded-full px-5 py-2 text-[14px] font-semibold text-[#4580f7] mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-[#4580f7] animate-pulse" />
            מופעל בינה מלאכותית
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-[clamp(42px,5.5vw,76px)] font-black leading-[1.05] tracking-[-0.03em] max-w-[900px] mx-auto mb-6"
          >
            הדמיית שיפוץ.{" "}
            <span className="bg-gradient-to-l from-[#4580f7] via-[#a78bfa] to-[#f472b6] bg-clip-text text-transparent">
              תוך שניות.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-[20px] text-white/50 max-w-[600px] mx-auto mb-10 leading-relaxed"
          >
            העלו תמונה של החדר, קבלו הדמיה ריאליסטית של השיפוץ, כתב כמויות מפורט, וניתוח הצעות מחיר — הכל אוטומטי עם AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href="/" className="bg-[#4580f7] hover:bg-[#3570e0] text-white text-[16px] font-bold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(69,128,247,0.35)]">
              התחל בחינם — בלי כרטיס אשראי ←
            </Link>
            <a href="#how" className="border border-white/15 hover:border-white/30 text-white text-[16px] font-bold px-8 py-3.5 rounded-xl transition-all hover:bg-white/[0.03]">
              איך זה עובד?
            </a>
          </motion.div>
        </motion.div>

        {/* Hero Screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0, 1] }}
          className="relative max-w-[1000px] mx-auto mt-16 px-6"
        >
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_40px_80px_rgba(0,0,0,0.5),0_0_60px_rgba(69,128,247,0.06)]">
            <Image src="/ads/screenshot-home-landscape.png" alt="ShiputzAI" width={1200} height={700} className="w-full h-auto" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050917] via-transparent to-transparent" />
          </div>
          {/* Glow behind screenshot */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-[200px] rounded-full blur-[80px]"
            style={{ background: "radial-gradient(ellipse, rgba(69,128,247,0.15) 0%, transparent 70%)" }} />
        </motion.div>
      </section>

      {/* ===== STATS ===== */}
      <section className="relative border-y border-white/[0.04] bg-[#0d1117]">
        <div className="max-w-[1100px] mx-auto px-6 py-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: "63%", label: "מהיר מעיצוב ידני" },
            { num: "127+", label: "בעלי מקצוע משתמשים" },
            { num: "8", label: "כלי AI במקום אחד" },
            { num: "₪99", label: "חד פעמי — בלי מנוי" },
          ].map((stat, i) => (
            <AnimatedSection key={i} delay={i * 0.1}>
              <div className="text-[44px] font-black bg-gradient-to-l from-[#4580f7] to-[#a78bfa] bg-clip-text text-transparent">
                {stat.num}
              </div>
              <div className="text-[14px] text-white/40 mt-1 font-medium">{stat.label}</div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-[120px] px-6">
        <AnimatedSection className="text-center mb-20">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black tracking-[-0.02em] mb-4">הכלים שישנו לך את השיפוץ</h2>
          <p className="text-[18px] text-white/40">כל מה שצריך כדי לתכנן, לדמיין ולחסוך — במקום אחד</p>
        </AnimatedSection>

        {/* Feature 1: Before/After */}
        <div className="max-w-[1100px] mx-auto mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="text-[13px] font-bold uppercase tracking-[1.5px] text-[#4580f7] mb-4">הדמיות AI</div>
              <h3 className="text-[36px] font-extrabold leading-[1.15] tracking-[-0.01em] mb-4">העלה תמונה. קבל הדמיית שיפוץ תוך שניות.</h3>
              <p className="text-[17px] text-white/50 leading-relaxed mb-6">ה-AI מנתח את החדר שלך ומייצר הדמיה ריאליסטית של איך הוא ייראה אחרי השיפוץ. בחר סגנון, שנה צבעים, הוסף רהיטים — בלחיצה.</p>
              <Link href="/visualize" className="inline-flex items-center gap-2 bg-[#4580f7] hover:bg-[#3570e0] text-white text-[14px] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5">
                נסו עכשיו ←
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <div className="grid grid-cols-2 gap-[2px] rounded-2xl overflow-hidden border border-white/[0.06]">
                <div className="relative">
                  <Image src="/examples/kitchen-before.jpg" alt="לפני" width={400} height={300} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 right-2 text-[11px] font-bold bg-black/70 text-white px-2.5 py-1 rounded-md uppercase tracking-wider">לפני</span>
                </div>
                <div className="relative">
                  <Image src="/examples/kitchen-after.jpg" alt="אחרי" width={400} height={300} className="w-full h-full object-cover" />
                  <span className="absolute bottom-2 left-2 text-[11px] font-bold bg-[#4580f7]/90 text-white px-2.5 py-1 rounded-md uppercase tracking-wider">אחרי</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Feature 2: Style Matcher */}
        <div className="max-w-[1100px] mx-auto mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center" dir="ltr">
            <AnimatedSection delay={0.2}>
              <FeatureImage src="/images/ai-vision/style-match-showcase.jpg" alt="Style Matcher" />
            </AnimatedSection>
            <AnimatedSection className="text-right" dir="rtl">
              <div className="text-[13px] font-bold uppercase tracking-[1.5px] text-[#a78bfa] mb-4">STYLE MATCHER</div>
              <h3 className="text-[36px] font-extrabold leading-[1.15] tracking-[-0.01em] mb-4">זיהוי סגנון + רשימת קניות מוכנה</h3>
              <p className="text-[17px] text-white/50 leading-relaxed mb-6">העלו תמונה של חדר שאהבתם — ה-AI מזהה את סגנון העיצוב, מפרט את כל המוצרים ומציע לינקים ישירים לקנייה בישראל.</p>
              <Link href="/style-match" className="inline-flex items-center gap-2 bg-[#a78bfa] hover:bg-[#9775e8] text-white text-[14px] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5">
                נסו עכשיו ←
              </Link>
            </AnimatedSection>
          </div>
        </div>

        {/* Feature 3: Floorplan */}
        <div className="max-w-[1100px] mx-auto mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="text-[13px] font-bold uppercase tracking-[1.5px] text-[#34d399] mb-4">תוכנית קומה חכמה</div>
              <h3 className="text-[36px] font-extrabold leading-[1.15] tracking-[-0.01em] mb-4">מתוכנית אדריכלית להדמיה תלת-ממדית</h3>
              <p className="text-[17px] text-white/50 leading-relaxed mb-6">העלו תוכנית קומה — ה-AI ממיר אותה להדמיה ריאליסטית של הדירה. תראו איך הסלון, המטבח וחדרי השינה ייראו במציאות.</p>
              <Link href="/floorplan" className="inline-flex items-center gap-2 bg-[#34d399] hover:bg-[#2bc48d] text-[#050917] text-[14px] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5">
                נסו עכשיו ←
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <FeatureImage src="/images/ai-vision/floorplan.jpg" alt="תוכנית קומה" />
            </AnimatedSection>
          </div>
        </div>

        {/* Feature 4: Video Tour */}
        <div className="max-w-[1100px] mx-auto mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center" dir="ltr">
            <AnimatedSection delay={0.2}>
              <FeatureImage src="/images/ai-vision/video-tour-thumb.jpg" alt="סיור וידאו" />
            </AnimatedSection>
            <AnimatedSection className="text-right" dir="rtl">
              <div className="text-[13px] font-bold uppercase tracking-[1.5px] text-[#f472b6] mb-4">סיור וידאו AI</div>
              <h3 className="text-[36px] font-extrabold leading-[1.15] tracking-[-0.01em] mb-4">הליכה וירטואלית בדירה החדשה</h3>
              <p className="text-[17px] text-white/50 leading-relaxed mb-6">סרטון AI שמדמה הליכה אמיתית בתוך ההדמיה שלכם. שתפו עם בן/בת הזוג, המעצב או הקבלן.</p>
              <Link href="/floorplan?mode=video" className="inline-flex items-center gap-2 bg-[#f472b6] hover:bg-[#e860a8] text-[#050917] text-[14px] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5">
                צרו סרטון ←
              </Link>
            </AnimatedSection>
          </div>
        </div>

        {/* Feature 5: Shop the Look */}
        <div className="max-w-[1100px] mx-auto mb-20">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div className="text-[13px] font-bold uppercase tracking-[1.5px] text-[#fbbf24] mb-4">SHOP THE LOOK</div>
              <h3 className="text-[36px] font-extrabold leading-[1.15] tracking-[-0.01em] mb-4">ראית עיצוב שאהבת? קנה אותו.</h3>
              <p className="text-[17px] text-white/50 leading-relaxed mb-6">העלו תמונת השראה וה-AI יזהה כל מוצר — רהיטים, תאורה, אביזרים — עם קישורים ישירים לרכישה.</p>
              <Link href="/shop-the-look" className="inline-flex items-center gap-2 bg-[#fbbf24] hover:bg-[#f0b420] text-[#050917] text-[14px] font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5">
                נסו עכשיו ←
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <FeatureImage src="/images/ai-vision/shop-look.jpg" alt="Shop the Look" />
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ===== MORE TOOLS GRID ===== */}
      <section className="py-[100px] px-6 border-t border-white/[0.04] bg-[#0d1117]">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-[36px] font-black tracking-[-0.02em] mb-4">ועוד כלים בארגז</h2>
        </AnimatedSection>
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-6">
          {[
            { title: "כתב כמויות", desc: "צלמו את החדר וקבלו פירוט מלא — ריצוף, צבע, חשמל, אינסטלציה. עם מחירי שוק.", img: "/features/feature-budget.png", color: "#4580f7" },
            { title: "ניתוח הצעות מחיר", desc: "העלו הצעת מחיר מקבלן — ה-AI ישווה מול מחירי שוק ויגיד אם המחיר הוגן.", img: "/features/feature-receipt.png", color: "#a78bfa" },
            { title: "עוזר AI לשיפוץ", desc: "שאלו כל שאלה על השיפוץ וקבלו תשובה מיידית מעוזר מומחה.", img: "/images/ai-vision/chat-support-thumb.jpg", color: "#34d399" },
          ].map((f, i) => (
            <AnimatedSection key={i} delay={i * 0.15}>
              <div className="group rounded-2xl overflow-hidden border border-white/[0.06] bg-[#050917] transition-all hover:border-white/[0.12] hover:-translate-y-1">
                <div className="h-[200px] overflow-hidden">
                  <Image src={f.img} alt={f.title} width={400} height={200} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-6">
                  <h4 className="text-[18px] font-bold mb-2">{f.title}</h4>
                  <p className="text-[14px] text-white/45 leading-relaxed">{f.desc}</p>
                </div>
                <div className="h-[2px] w-full" style={{ background: `linear-gradient(to left, ${f.color}, transparent)` }} />
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ===== LOGOS ===== */}
      <section className="py-16 px-6 border-t border-white/[0.04]">
        <AnimatedSection>
          <p className="text-center text-[12px] uppercase tracking-[3px] text-white/25 font-semibold mb-8">
            קישורים ישירים לחנויות המובילות
          </p>
          <div className="flex items-center justify-center gap-10 flex-wrap opacity-30">
            {["ikea", "homecenter", "ace", "foxhome", "aminach", "tambur"].map(logo => (
              <Image key={logo} src={`/logos/${logo}.png`} alt={logo} width={80} height={28} className="h-7 w-auto brightness-0 invert" />
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-[120px] px-6 bg-[#0d1117] border-t border-white/[0.04]">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black tracking-[-0.02em] mb-4">איך זה עובד?</h2>
          <p className="text-[18px] text-white/40">שלושה צעדים — מתמונה לתוכנית שיפוץ מלאה</p>
        </AnimatedSection>
        <div className="max-w-[1000px] mx-auto grid md:grid-cols-3 gap-6">
          {[
            { num: "1", title: "העלו תמונה", desc: "צלמו את החדר או העלו תמונה קיימת. ה-AI מזהה אוטומטית את המרחב." },
            { num: "2", title: "בחרו כלי", desc: "הדמיית שיפוץ? כתב כמויות? ניתוח מחיר? בחרו את הכלי שמתאים." },
            { num: "3", title: "קבלו תוצאה", desc: "תוך שניות תקבלו תוצאה מקצועית לשיתוף עם הקבלן, המעצב או בן/בת הזוג." },
          ].map((step, i) => (
            <AnimatedSection key={i} delay={i * 0.15}>
              <div className="relative rounded-2xl p-8 border border-white/[0.06] bg-white/[0.02] text-center transition-all hover:-translate-y-1 hover:border-[#4580f7]/20 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4580f7] to-[#7c3aed] text-white text-[22px] font-black flex items-center justify-center mx-auto mb-6 shadow-[0_8px_24px_rgba(69,128,247,0.25)] transition-transform group-hover:scale-110">
                  {step.num}
                </div>
                <h4 className="text-[20px] font-bold mb-3">{step.title}</h4>
                <p className="text-[15px] text-white/45 leading-relaxed">{step.desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-[120px] px-6">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black tracking-[-0.02em] mb-4">מה אומרים עלינו</h2>
          <p className="text-[18px] text-white/40">בעלי מקצוע ולקוחות שכבר משתמשים</p>
        </AnimatedSection>
        <div className="max-w-[1100px] mx-auto grid md:grid-cols-3 gap-6">
          {[
            { text: "חסך לי שעות של עבודה. במקום לשבת עם אקסל ולחשב כמויות, פשוט צילמתי את הדירה וקיבלתי כתב כמויות מפורט תוך דקה.", name: "דניאל כ.", role: "קבלן שיפוצים, תל אביב", initial: "ד" },
            { text: "הלקוחות שלי מתים על ההדמיות. במקום להסביר במילים איך החדר ייראה, אני מראה להם תמונה ריאליסטית. סוגר עסקאות יותר מהר.", name: "שירה ד.", role: "מעצבת פנים", initial: "ש" },
            { text: "קיבלתי הצעת מחיר מקבלן והרגשתי שמשהו לא בסדר. העליתי ל-ShiputzAI וזה הראה לי שהמחיר מנופח ב-40%. חסך לי אלפי שקלים.", name: "אורן מ.", role: "בעל דירה, חיפה", initial: "א" },
          ].map((t, i) => (
            <AnimatedSection key={i} delay={i * 0.15}>
              <div className="rounded-2xl p-8 border border-white/[0.06] bg-[#0d1117] transition-all hover:border-[#4580f7]/15">
                <div className="text-[#fbbf24] text-[18px] mb-5 tracking-wider">★★★★★</div>
                <p className="text-[15px] text-white/65 leading-[1.8] mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#4580f7] to-[#7c3aed] flex items-center justify-center font-bold text-[17px]">
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold">{t.name}</div>
                    <div className="text-[13px] text-white/35">{t.role}</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-[120px] px-6 bg-[#0d1117] border-t border-white/[0.04]">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-[clamp(32px,4vw,48px)] font-black tracking-[-0.02em] mb-4">מחירים פשוטים</h2>
          <p className="text-[18px] text-white/40">בלי מנויים. בלי הפתעות. שלם על מה שאתה צריך.</p>
        </AnimatedSection>
        <div className="max-w-[800px] mx-auto grid md:grid-cols-2 gap-6">
          {/* Free */}
          <AnimatedSection>
            <div className="rounded-2xl p-10 border border-white/[0.06] bg-white/[0.02] h-full flex flex-col">
              <h4 className="text-[22px] font-bold mb-2">חינם</h4>
              <div className="text-[52px] font-black mb-1">₪0</div>
              <div className="text-[14px] text-white/35 mb-8">לנצח</div>
              <ul className="flex-1 mb-8">
                {["הדמיית שיפוץ אחת", "כתב כמויות אחד", "ניתוח הצעת מחיר אחד", "תמיכה בצ׳אט"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3 text-[15px] text-white/60 border-b border-white/[0.04] last:border-none">
                    <span className="text-[#4580f7] font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/" className="w-full text-center border border-white/15 hover:border-white/30 text-white text-[15px] font-bold px-6 py-3.5 rounded-xl transition-all hover:bg-white/[0.03]">
                התחל בחינם
              </Link>
            </div>
          </AnimatedSection>

          {/* Pro */}
          <AnimatedSection delay={0.15}>
            <div className="relative rounded-2xl p-10 border-2 border-[#4580f7] bg-[#4580f7]/[0.04] h-full flex flex-col">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-l from-[#4580f7] to-[#7c3aed] text-white text-[12px] font-bold px-4 py-1.5 rounded-full">
                הכי פופולרי
              </div>
              <h4 className="text-[22px] font-bold mb-2">Pro</h4>
              <div className="text-[52px] font-black mb-1">₪99 <span className="text-[16px] font-medium text-white/40">חד פעמי</span></div>
              <div className="text-[14px] text-white/35 mb-8">4 קרדיטים לכל הכלים</div>
              <ul className="flex-1 mb-8">
                {["4 הדמיות שיפוץ", "כתב כמויות ללא הגבלה", "ניתוח הצעות מחיר", "Shop the Look", "סריקת קבלות", "סיור וידאו AI", "תמיכה בעדיפות"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 py-3 text-[15px] text-white/60 border-b border-white/[0.04] last:border-none">
                    <span className="text-[#4580f7] font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/" className="w-full text-center bg-[#4580f7] hover:bg-[#3570e0] text-white text-[15px] font-bold px-6 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(69,128,247,0.3)]">
                שדרג ל-Pro ←
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative py-[120px] px-6 text-center overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[300px] rounded-full blur-[100px]"
          style={{ background: "radial-gradient(ellipse, rgba(69,128,247,0.1) 0%, transparent 70%)" }} />
        <AnimatedSection className="relative z-10">
          <h2 className="text-[clamp(36px,4.5vw,52px)] font-black tracking-[-0.02em] mb-5">מוכנים לשפץ חכם?</h2>
          <p className="text-[18px] text-white/40 mb-10 max-w-[500px] mx-auto">
            הצטרפו למאות בעלי מקצוע ובעלי דירות שכבר משתמשים ב-ShiputzAI
          </p>
          <Link href="/" className="bg-[#4580f7] hover:bg-[#3570e0] text-white text-[18px] font-bold px-12 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(69,128,247,0.35)]">
            התחל בחינם — בלי כרטיס אשראי ←
          </Link>
        </AnimatedSection>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 px-6 border-t border-white/[0.04] text-center text-[14px] text-white/25">
        © 2026 ShiputzAI. כל הזכויות שמורות.
      </footer>
    </div>
  );
}
